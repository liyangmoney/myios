import { query, transaction } from '../config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    
    sql += ' ORDER BY p.group_sort, p.file_code'
    
    const procedures = await query(sql, params)
    
    // 转换字段名为驼峰命名
    const formattedProcedures = procedures.map(proc => ({
      id: proc.id,
      fileCode: proc.file_code,
      fileName: proc.file_name,
      category: proc.category,
      groupSort: proc.group_sort,
      isKo: proc.is_ko,
      department: proc.department,
      responsiblePerson: proc.responsible_person,
      reviewer: proc.reviewer,
      approver: proc.approver,
      version: proc.version,
      status: proc.status,
      priority: proc.priority,
      description: proc.description,
      filePath: proc.file_path,
      createdBy: proc.created_by,
      createdByName: proc.created_by_name,
      createdAt: proc.created_at,
      updatedAt: proc.updated_at,
      recordCount: proc.record_count,
      uploadedCount: proc.uploaded_count
    }))
    
    // 获取每个程序文件的人员
    for (const proc of formattedProcedures) {
      const persons = await query(
        'SELECT * FROM procedure_file_person WHERE procedure_file_id = ?',
        [proc.id]
      )
      // 转换人员字段名
      proc.persons = persons.map(p => ({
        id: p.id,
        personName: p.person_name,
        personRole: p.person_role,
        department: p.department
      }))
    }
    
    res.json({ code: 200, data: formattedProcedures })
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
    
    const procedure = {
      id: procedures[0].id,
      fileCode: procedures[0].file_code,
      fileName: procedures[0].file_name,
      category: procedures[0].category,
      groupSort: procedures[0].group_sort,
      isKo: procedures[0].is_ko,
      department: procedures[0].department,
      responsiblePerson: procedures[0].responsible_person,
      reviewer: procedures[0].reviewer,
      approver: procedures[0].approver,
      version: procedures[0].version,
      status: procedures[0].status,
      priority: procedures[0].priority,
      description: procedures[0].description,
      filePath: procedures[0].file_path,
      createdBy: procedures[0].created_by,
      createdByName: procedures[0].created_by_name,
      createdAt: procedures[0].created_at,
      updatedAt: procedures[0].updated_at
    }
    
    // 获取相关人员
    const persons = await query(
      'SELECT * FROM procedure_file_person WHERE procedure_file_id = ?',
      [id]
    )
    procedure.persons = persons.map(p => ({
      id: p.id,
      personName: p.person_name,
      personRole: p.person_role,
      department: p.department
    }))
    
    // 获取需要编制的记录
    const records = await query(`
      SELECT r.*, u.user_name as uploaded_by_name
      FROM procedure_file_record r
      LEFT JOIN sys_user u ON r.uploaded_by = u.id
      WHERE r.procedure_file_id = ?
      ORDER BY r.id
    `, [id])
    procedure.records = records.map(r => ({
      id: r.id,
      recordName: r.record_name,
      recordNumber: r.record_number,
      description: r.description,
      filePath: r.file_path,
      uploadedBy: r.uploaded_by,
      uploadedByName: r.uploaded_by_name,
      uploadedAt: r.uploaded_at,
      createdAt: r.created_at,
      status: r.status
    }))
    
    res.json({ code: 200, data: procedure })
  } catch (error) {
    console.error('获取程序文件详情失败:', error)
    res.status(500).json({ code: 500, message: '获取程序文件详情失败' })
  }
}

// 生成记录编号（YYYYMMDD-001格式）
const generateRecordNumber = async (procedureFileId) => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  
  // 查询当天该程序文件的记录数
  const countResult = await query(`
    SELECT COUNT(*) as count 
    FROM procedure_file_record 
    WHERE procedure_file_id = ? 
    AND DATE(created_at) = CURDATE()
  `, [procedureFileId])
  
  const sequence = String(countResult[0]?.count + 1 || 1).padStart(3, '0')
  return `${dateStr}-${sequence}`
}

// 创建程序文件记录
export const createRecord = async (req, res) => {
  try {
    const { procedureFileId, recordName, recordNumber, description } = req.body
    
    // 使用前端传递的记录编号，如果没有则自动生成
    let finalRecordNumber = recordNumber
    if (!finalRecordNumber) {
      finalRecordNumber = await generateRecordNumber(procedureFileId)
    }
    
    const result = await query(
      `INSERT INTO procedure_file_record (procedure_file_id, record_name, record_number, description, status) 
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [procedureFileId, recordName, finalRecordNumber, description]
    )
    
    res.json({ 
      code: 200, 
      message: '记录创建成功', 
      data: { 
        id: result.insertId,
        recordNumber: finalRecordNumber
      } 
    })
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
    
    // 先获取记录信息，检查是否有文件
    const records = await query(
      'SELECT file_path FROM procedure_file_record WHERE id = ?',
      [id]
    )
    
    if (records.length > 0 && records[0].file_path) {
      // 删除物理文件
      const filePath = path.join(__dirname, '../../', records[0].file_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('文件已删除:', filePath)
      }
    }
    
    // 删除数据库记录
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

// 上传程序文件（新功能）
export const uploadProcedureFile = async (req, res) => {
  try {
    const { procedureFileId, recordId } = req.body // 程序文件ID和记录ID
    const file = req.file // 上传的文件
    
    if (!procedureFileId || !file) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    // 获取程序文件名称
    const procedures = await query(
      'SELECT file_name FROM procedure_file WHERE id = ?',
      [procedureFileId]
    )
    
    if (procedures.length === 0) {
      return res.status(404).json({ code: 404, message: '程序文件不存在' })
    }
    
    const procedureFileName = procedures[0].file_name
    const year = new Date().getFullYear()

    // 创建文件夹：uploads/程序文件名称/年份/
    const baseUploadDir = path.join(__dirname, '../../uploads')
    const uploadDir = path.join(baseUploadDir, procedureFileName, String(year))
    
    // 确保基础文件夹存在
    if (!fs.existsSync(baseUploadDir)) {
      fs.mkdirSync(baseUploadDir, { recursive: true })
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // 保存文件（保持原文件名，修复中文乱码）
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, file.buffer)

    // 更新记录的文件路径
    if (recordId) {
      await query(
        `UPDATE procedure_file_record 
         SET file_path = ?, status = 'UPLOADED', uploaded_at = NOW()
         WHERE id = ?`,
        [`/uploads/${procedureFileName}/${year}/${fileName}`, recordId]
      )
    }

    res.json({ 
      code: 200, 
      message: '文件上传成功', 
      data: { 
        filePath: `/uploads/${procedureFileName}/${year}/${fileName}`
      } 
    })

  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({ code: 500, message: '文件上传失败' })
  }
}