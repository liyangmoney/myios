import { query, transaction } from '../config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取当前年份
const getCurrentYear = () => new Date().getFullYear()

// 动态替换文件编号后四位为年份
const formatFileCode = (fileCode, year) => {
  if (!fileCode) return fileCode
  // 匹配末尾的4位年份，替换为当前年份
  return fileCode.replace(/-\d{4}$/, `-${year}`)
}

// 获取程序文件列表
export const getProcedures = async (req, res) => {
  try {
    const { category, department, keyword, year } = req.query
    
    // 默认使用当前年份
    const currentYear = parseInt(year) || getCurrentYear()
    
    // 程序文件是固定模板，查询所有（不区分年份）
    let sql = `
      SELECT p.*, u.user_name as created_by_name,
             (SELECT COUNT(*) FROM procedure_file_record r 
              WHERE r.procedure_file_id = p.id AND (r.year = ? OR r.year IS NULL OR r.year = 0)) as record_count,
             (SELECT COUNT(*) FROM procedure_file_record r 
              WHERE r.procedure_file_id = p.id AND (r.year = ? OR r.year IS NULL OR r.year = 0) AND r.status = 'UPLOADED') as uploaded_count
      FROM procedure_file p
      LEFT JOIN sys_user u ON p.created_by = u.id
      WHERE 1=1
    `
    const params = [currentYear, currentYear]
    
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
    
    // 转换字段名为驼峰命名，并动态替换文件编号后四位
    const formattedProcedures = procedures.map(proc => ({
      id: proc.id,
      fileCode: formatFileCode(proc.file_code, currentYear),  // 动态替换后四位
      originalFileCode: proc.file_code,  // 保留原始编号
      fileName: proc.file_name,
      category: proc.category,
      groupSort: proc.group_sort,
      isKo: proc.is_ko,
      department: proc.department,
      responsiblePerson: proc.responsible_person,
      reviewer: proc.reviewer,
      approver: proc.approver,
      version: proc.version,
      year: currentYear,  // 返回当前年份
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
      proc.persons = persons.map(p => ({
        id: p.id,
        personName: p.person_name,
        personRole: p.person_role,
        department: p.department
      }))
    }
    
    res.json({ code: 200, data: formattedProcedures, year: currentYear })
  } catch (error) {
    console.error('获取程序文件列表失败:', error)
    res.status(500).json({ code: 500, message: '获取程序文件列表失败' })
  }
}

// 获取程序文件详情
export const getProcedureDetail = async (req, res) => {
  try {
    const { id } = req.params
    const { year } = req.query
    const currentYear = parseInt(year) || getCurrentYear()
    
    // 获取程序文件基本信息（不区分年份）
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
      fileCode: formatFileCode(procedures[0].file_code, currentYear),  // 动态替换后四位
      originalFileCode: procedures[0].file_code,
      fileName: procedures[0].file_name,
      category: procedures[0].category,
      groupSort: procedures[0].group_sort,
      isKo: procedures[0].is_ko,
      department: procedures[0].department,
      responsiblePerson: procedures[0].responsible_person,
      reviewer: procedures[0].reviewer,
      approver: procedures[0].approver,
      version: procedures[0].version,
      year: currentYear,
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
    
    // 获取需要编制的记录（按年份筛选）
    const records = await query(`
      SELECT r.*, u.user_name as uploaded_by_name
      FROM procedure_file_record r
      LEFT JOIN sys_user u ON r.uploaded_by = u.id
      WHERE r.procedure_file_id = ? AND (r.year = ? OR r.year IS NULL OR r.year = 0)
      ORDER BY r.id
    `, [id, currentYear])
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
    
    res.json({ code: 200, data: procedure, year: currentYear })
  } catch (error) {
    console.error('获取程序文件详情失败:', error)
    res.status(500).json({ code: 500, message: '获取程序文件详情失败' })
  }
}

// 生成记录编号（YYYYMMDD-001格式）
const generateRecordNumber = async (procedureFileId, year) => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  
  // 查询当天该程序文件的记录数（按年份）
  const countResult = await query(`
    SELECT COUNT(*) as count 
    FROM procedure_file_record 
    WHERE procedure_file_id = ? 
    AND year = ?
    AND DATE(created_at) = CURDATE()
  `, [procedureFileId, year])
  
  const sequence = String(countResult[0]?.count + 1 || 1).padStart(3, '0')
  return `${dateStr}-${sequence}`
}

// 创建程序文件记录
export const createRecord = async (req, res) => {
  try {
    const { procedureFileId, recordName, recordNumber, description, year } = req.body
    const currentYear = parseInt(year) || getCurrentYear()
    
    // 使用前端传递的记录编号，如果没有则自动生成
    let finalRecordNumber = recordNumber
    if (!finalRecordNumber) {
      finalRecordNumber = await generateRecordNumber(procedureFileId, currentYear)
    }
    
    const result = await query(
      `INSERT INTO procedure_file_record (procedure_file_id, record_name, record_number, description, status, year) 
       VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [procedureFileId, recordName, finalRecordNumber, description, currentYear]
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
    // 程序文件是固定模板，部门列表不区分年份
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

    // 获取程序文件名称和年份
    const procedures = await query(
      'SELECT file_name, year FROM procedure_file WHERE id = ?',
      [procedureFileId]
    )
    
    if (procedures.length === 0) {
      return res.status(404).json({ code: 404, message: '程序文件不存在' })
    }
    
    const procedureFileName = procedures[0].file_name
    const year = procedures[0].year || getCurrentYear()

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

// 获取可用年份列表
export const getAvailableYears = async (req, res) => {
  try {
    const years = await query(`
      SELECT DISTINCT year FROM procedure_file 
      WHERE year IS NOT NULL 
      ORDER BY year DESC
    `)
    
    // 如果没有数据，至少返回当前年份
    if (years.length === 0) {
      return res.json({ code: 200, data: [getCurrentYear()] })
    }
    
    res.json({ code: 200, data: years.map(y => y.year) })
  } catch (error) {
    console.error('获取年份列表失败:', error)
    res.status(500).json({ code: 500, message: '获取年份列表失败' })
  }
}

// 获取年度统计
export const getAnnualStatistics = async (req, res) => {
  try {
    const { year } = req.query
    const currentYear = parseInt(year) || getCurrentYear()
    
    // 文件统计
    const fileStats = await query(`
      SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_ko = 1 THEN 1 ELSE 0 END) as ko
      FROM procedure_file
      WHERE year = ?
      GROUP BY category
    `, [currentYear])
    
    // 记录完成率
    const completionStats = await query(`
      SELECT 
        p.category,
        COUNT(r.id) as total_records,
        SUM(CASE WHEN r.status = 'UPLOADED' THEN 1 ELSE 0 END) as completed
      FROM procedure_file p
      LEFT JOIN procedure_file_record r ON p.id = r.procedure_file_id AND r.year = ?
      WHERE p.year = ?
      GROUP BY p.category
    `, [currentYear, currentYear])
    
    res.json({
      code: 200,
      data: {
        year: currentYear,
        fileStats,
        completionStats
      }
    })
  } catch (error) {
    console.error('获取年度统计失败:', error)
    res.status(500).json({ code: 500, message: '获取年度统计失败' })
  }
}

// 年度文件归档
export const archiveYearFiles = async (req, res) => {
  try {
    const { year, remark } = req.body
    const archiveYear = parseInt(year) || getCurrentYear()
    const archiveBy = req.userId
    
    // 创建归档目录
    const archiveDir = path.join(__dirname, `../../archives/${archiveYear}`)
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true })
    }
    
    // 获取该年度所有已上传的文件
    const records = await query(`
      SELECT r.file_path, p.file_name, r.record_number
      FROM procedure_file_record r
      JOIN procedure_file p ON r.procedure_file_id = p.id
      WHERE r.year = ? AND r.status = 'UPLOADED' AND r.file_path IS NOT NULL
    `, [archiveYear])
    
    let archivedCount = 0
    
    // 复制文件到归档目录
    for (const record of records) {
      if (record.file_path) {
        const sourcePath = path.join(__dirname, '../../', record.file_path)
        const fileName = path.basename(record.file_path)
        const targetPath = path.join(archiveDir, fileName)
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath)
          archivedCount++
        }
      }
    }
    
    // 记录归档日志
    await query(
      `INSERT INTO file_archive (year, archive_path, file_count, archive_by, status, remark)
       VALUES (?, ?, ?, ?, 'COMPLETED', ?)`,
      [archiveYear, archiveDir, archivedCount, archiveBy, remark]
    )
    
    res.json({
      code: 200,
      message: '归档完成',
      data: {
        year: archiveYear,
        archivedCount,
        archivePath: archiveDir
      }
    })
  } catch (error) {
    console.error('归档失败:', error)
    res.status(500).json({ code: 500, message: '归档失败: ' + error.message })
  }
}

// 年度自动复制程序文件
export const copyYearFiles = async (req, res) => {
  try {
    const { sourceYear, targetYear } = req.body
    const userId = req.userId
    
    if (!sourceYear || !targetYear) {
      return res.status(400).json({ code: 400, message: '缺少源年份或目标年份' })
    }
    
    if (parseInt(sourceYear) >= parseInt(targetYear)) {
      return res.status(400).json({ code: 400, message: '目标年份必须大于源年份' })
    }
    
    // 检查目标年份是否已有数据
    const existingCount = await query(
      'SELECT COUNT(*) as count FROM procedure_file WHERE year = ?',
      [targetYear]
    )
    
    if (existingCount[0].count > 0) {
      return res.status(400).json({ code: 400, message: `${targetYear}年度已有数据，无法复制` })
    }
    
    // 获取源年份的所有程序文件
    const sourceFiles = await query(
      'SELECT * FROM procedure_file WHERE year = ?',
      [sourceYear]
    )
    
    if (sourceFiles.length === 0) {
      return res.status(400).json({ code: 400, message: `${sourceYear}年度没有数据可复制` })
    }
    
    const copiedFiles = []
    const copiedPersons = []
    
    // 开始事务
    await transaction(async (conn) => {
      for (const file of sourceFiles) {
        // 更新文件编号后四位为新年份
        // 假设编号格式为：QMS-CX01-2025 → QMS-CX01-2026
        const oldFileCode = file.file_code
        const newFileCode = oldFileCode.replace(/-\d{4}$/, `-${targetYear}`)
        
        // 插入新的程序文件
        const insertResult = await conn.query(
          `INSERT INTO procedure_file 
           (file_code, file_name, category, group_sort, is_ko, department, 
            responsible_person, reviewer, approver, version, year, status, 
            priority, description, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            newFileCode,
            file.file_name,
            file.category,
            file.group_sort,
            file.is_ko,
            file.department,
            file.responsible_person,
            file.reviewer,
            file.approver,
            targetYear, // 版本号也用新年份
            targetYear,
            'ACTIVE',
            file.priority,
            file.description,
            userId
          ]
        )
        
        const newFileId = insertResult[0].insertId
        copiedFiles.push({ oldId: file.id, newId: newFileId, oldCode: oldFileCode, newCode: newFileCode })
        
        // 复制相关人员
        const persons = await conn.query(
          'SELECT * FROM procedure_file_person WHERE procedure_file_id = ?',
          [file.id]
        )
        
        for (const person of persons[0]) {
          await conn.query(
            `INSERT INTO procedure_file_person 
             (procedure_file_id, person_name, person_role, department, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [newFileId, person.person_name, person.person_role, person.department]
          )
          copiedPersons.push({ fileId: newFileId, personName: person.person_name })
        }
      }
    })
    
    res.json({
      code: 200,
      message: '年度复制完成',
      data: {
        sourceYear,
        targetYear,
        copiedFileCount: copiedFiles.length,
        copiedPersonCount: copiedPersons.length,
        files: copiedFiles
      }
    })
    
  } catch (error) {
    console.error('年度复制失败:', error)
    res.status(500).json({ code: 500, message: '年度复制失败: ' + error.message })
  }
}