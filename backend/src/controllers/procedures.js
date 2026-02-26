import { query, transaction } from '../config/database.js'

// 获取程序文件列表
export const getProcedures = async (req, res) => {
  try {
    const { category, department, keyword } = req.query
    
    let sql = `
      SELECT p.*, u.user_name as created_by_name,
             (SELECT COUNT(*) FROM procedure_file_record r WHERE r.procedure_file_id = p.id) as record_count,
             (SELECT COUNT(*) FROM procedure_file_record r WHERE r.procedure_file_id = p.id AND r.status = 'UPLOADED') as uploaded_count
      FROM procedure_file p
      LEFT JOIN sys_user u ON p.created_by = u.id
      WHERE 1=1
    `
    const params = []
    
    if (category) {
      sql += ' AND p.category = ?'
      params.push(category)
    }
    
    if (department) {
      sql += ' AND p.department = ?'
      params.push(department)
    }
    
    if (keyword) {
      sql += ' AND (p.file_code LIKE ? OR p.file_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY p.category, p.file_code'
    
    const procedures = await query(sql, params)
    
    // 获取每个程序文件的人员
    for (const proc of procedures) {
      const persons = await query(
        'SELECT * FROM procedure_file_person WHERE procedure_file_id = ?',
        [proc.id]
      )
      proc.persons = persons
    }
    
    res.json({ code: 200, data: procedures })
  } catch (error) {
    console.error('获取程序文件列表失败:', error)
    res.status(500).json({ code: 500, message: '获取程序文件列表失败' })
  }
}

// 获取程序文件详情
export const getProcedureDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    // 获取程序文件基本信息
    const procedures = await query(`
      SELECT p.*, u.user_name as created_by_name
      FROM procedure_file p
      LEFT JOIN sys_user u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id])
    
    if (procedures.length === 0) {
      return res.status(404).json({ code: 404, message: '程序文件不存在' })
    }
    
    const procedure = procedures[0]
    
    // 获取相关人员
    const persons = await query(
      'SELECT * FROM procedure_file_person WHERE procedure_file_id = ?',
      [id]
    )
    procedure.persons = persons
    
    // 获取需要编制的记录
    const records = await query(`
      SELECT r.*, u.user_name as uploaded_by_name
      FROM procedure_file_record r
      LEFT JOIN sys_user u ON r.uploaded_by = u.id
      WHERE r.procedure_file_id = ?
      ORDER BY r.id
    `, [id])
    procedure.records = records
    
    res.json({ code: 200, data: procedure })
  } catch (error) {
    console.error('获取程序文件详情失败:', error)
    res.status(500).json({ code: 500, message: '获取程序文件详情失败' })
  }
}

// 创建程序文件记录
export const createRecord = async (req, res) => {
  try {
    const { procedureFileId, recordName, recordCode, description } = req.body
    
    const result = await query(
      `INSERT INTO procedure_file_record (procedure_file_id, record_name, record_code, description, status) 
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [procedureFileId, recordName, recordCode, description]
    )
    
    res.json({ code: 200, message: '记录创建成功', data: { id: result.insertId } })
  } catch (error) {
    console.error('创建记录失败:', error)
    res.status(500).json({ code: 500, message: '创建记录失败' })
  }
}

// 更新记录（上传文件后）
export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params
    const { filePath } = req.body
    
    await query(
      `UPDATE procedure_file_record SET 
       file_path = ?, uploaded_by = ?, uploaded_at = NOW(), status = 'UPLOADED'
       WHERE id = ?`,
      [filePath, req.userId, id]
    )
    
    res.json({ code: 200, message: '记录更新成功' })
  } catch (error) {
    console.error('更新记录失败:', error)
    res.status(500).json({ code: 500, message: '更新记录失败' })
  }
}

// 删除记录
export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params
    
    await query('DELETE FROM procedure_file_record WHERE id = ?', [id])
    
    res.json({ code: 200, message: '记录删除成功' })
  } catch (error) {
    console.error('删除记录失败:', error)
    res.status(500).json({ code: 500, message: '删除记录失败' })
  }
}

// 获取所有部门列表
export const getDepartments = async (req, res) => {
  try {
    const departments = await query(
      'SELECT DISTINCT department FROM procedure_file WHERE department IS NOT NULL ORDER BY department'
    )
    res.json({ code: 200, data: departments.map(d => d.department) })
  } catch (error) {
    console.error('获取部门列表失败:', error)
    res.status(500).json({ code: 500, message: '获取部门列表失败' })
  }
}

// 添加人员
export const addPerson = async (req, res) => {
  try {
    const { procedureFileId, personName, personRole, department } = req.body
    
    const result = await query(
      `INSERT INTO procedure_file_person (procedure_file_id, person_name, person_role, department) 
       VALUES (?, ?, ?, ?)`,
      [procedureFileId, personName, personRole, department]
    )
    
    res.json({ code: 200, message: '人员添加成功', data: { id: result.insertId } })
  } catch (error) {
    console.error('添加人员失败:', error)
    res.status(500).json({ code: 500, message: '添加人员失败' })
  }
}

// 删除人员
export const deletePerson = async (req, res) => {
  try {
    const { id } = req.params
    
    await query('DELETE FROM procedure_file_person WHERE id = ?', [id])
    
    res.json({ code: 200, message: '人员删除成功' })
  } catch (error) {
    console.error('删除人员失败:', error)
    res.status(500).json({ code: 500, message: '删除人员失败' })
  }
}
