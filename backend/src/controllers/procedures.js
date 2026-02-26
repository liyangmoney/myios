import fs from 'fs'
import path from 'path'

export const uploadProcedureFile = async (req, res) => {
  try {
    const { procedureFileId } = req.body // 表示程序文件 ID
    const file = req.file // 上传的文件
    
    if (!procedureFileId || !file) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    const uploadDate = new Date()
    const year = uploadDate.getFullYear()
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '') // 20260226

    // 确保目录按年份分类
    const uploadDir = path.join(__dirname, `../../uploads/程序文件/${year}`)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // 生成记录编号 YYYYMMDD-001
    const countResult = await query(`
      SELECT COUNT(*) as count FROM procedure_file_record 
      WHERE DATE(created_at) = CURDATE()
    `)
    const recordCount = countResult[0]?.count || 0
    const recordNum = `${dateStr}-${String(recordCount + 1).padStart(3, '0')}`

    // 保存文件
    const filePath = path.join(uploadDir, file.originalname)
    fs.writeFileSync(filePath, file.buffer)

    // 保存记录至数据库
    await query(`
      INSERT INTO procedure_file_record (procedure_file_id, file_path, record_number, created_at)
      VALUES (?, ?, ?, NOW())
    `, [procedureFileId, filePath, recordNum])

    res.json({ code: 200, message: '文件上传成功', data: { filePath, recordNum } })

  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({ code: 500, message: '文件上传失败' })
  }
}

export const addPerson = async (req, res) => {
  try {
    const { procedureFileId, personName, personRole, department } = req.body

    if (!procedureFileId || !personName || !personRole || !department) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    await query(`
      INSERT INTO procedure_file_person (procedure_file_id, person_name, person_role, department, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [procedureFileId, personName, personRole, department])

    res.json({ code: 200, message: '人员添加成功' })
  } catch (error) {
    console.error('添加人员失败:', error)
    res.status(500).json({ code: 500, message: '添加人员失败' })
  }
}

export const createRecord = async (req, res) => {
  try {
    const { procedureFileId, recordDetails } = req.body

    if (!procedureFileId || !recordDetails) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    const result = await query(`
      INSERT INTO procedure_file_record (procedure_file_id, record_details, created_at)
      VALUES (?, ?, NOW())
    `, [procedureFileId, recordDetails])

    res.json({ code: 200, message: '记录创建成功', data: { id: result.insertId } })
  } catch (error) {
    console.error('创建记录失败:', error)
    res.status(500).json({ code: 500, message: '创建记录失败' })
  }
}

export const deletePerson = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    await query(`
      DELETE FROM procedure_file_person 
      WHERE id = ?
    `, [id])

    res.json({ code: 200, message: '删除人员成功' })
  } catch (error) {
    console.error('删除人员失败:', error)
    res.status(500).json({ code: 500, message: '删除人员失败' })
  }
}