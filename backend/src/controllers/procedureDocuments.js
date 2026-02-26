import { query } from '../config/database.js'

// 获取文件分类
export const getCategories = async (req, res) => {
  try {
    const categories = await query(
      'SELECT * FROM pis_document_category ORDER BY sort_order'
    )
    res.json({ code: 200, data: categories })
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ code: 500, message: '获取分类失败' })
  }
}

// 获取42个文件列表
export const getDocuments = async (req, res) => {
  try {
    const { 
      categoryCode, 
      department, 
      priority, 
      keyword,
      page = 1, 
      pageSize = 50 
    } = req.query
    
    // 确保是数字
    const pageNum = parseInt(page) || 1
    const pageSizeNum = parseInt(pageSize) || 50
    const offset = (pageNum - 1) * pageSizeNum
    
    let sql = `
      SELECT d.*, c.name as category_name, u.user_name as upload_user_name
      FROM pis_procedure_document d
      LEFT JOIN pis_document_category c ON d.category_code = c.code
      LEFT JOIN sys_user u ON d.upload_user_id = u.id
      WHERE 1=1
    `
    const params = []
    
    if (categoryCode) {
      sql += ' AND d.category_code = ?'
      params.push(categoryCode)
    }
    
    if (department) {
      sql += ' AND d.department = ?'
      params.push(department)
    }
    
    if (priority) {
      sql += ' AND d.priority = ?'
      params.push(priority)
    }
    
    if (keyword) {
      sql += ' AND (d.document_code LIKE ? OR d.document_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    // 按分类和排序号排序
    sql += ' ORDER BY d.category_code, d.sort_number, d.document_code'
    // MySQL 8.0 兼容：直接拼接 LIMIT 和 OFFSET
    sql += ` LIMIT ${pageSizeNum} OFFSET ${offset}`
    
    const documents = await query(sql, params)
    
    // 转换字段名为驼峰命名
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      documentCode: doc.document_code,
      documentName: doc.document_name,
      categoryCode: doc.category_code,
      categoryName: doc.category_name,
      department: doc.department,
      version: doc.version,
      status: doc.status,
      priority: doc.priority,
      sortNumber: doc.sort_number,
      filePath: doc.file_path,
      uploadUserId: doc.upload_user_id,
      uploadUserName: doc.upload_user_name,
      uploadTime: doc.upload_time,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }))
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM pis_procedure_document WHERE 1=1'
    const countParams = []
    
    if (categoryCode) {
      countSql += ' AND category_code = ?'
      countParams.push(categoryCode)
    }
    if (department) {
      countSql += ' AND department = ?'
      countParams.push(department)
    }
    if (priority) {
      countSql += ' AND priority = ?'
      countParams.push(priority)
    }
    if (keyword) {
      countSql += ' AND (document_code LIKE ? OR document_name LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    const [countResult] = await query(countSql, countParams)
    
    // 按分类分组统计
    const statsRaw = await query(`
      SELECT category_code, COUNT(*) as count 
      FROM pis_procedure_document 
      GROUP BY category_code
    `)
    
    // 转换统计数据的字段名
    const stats = statsRaw.map(s => ({
      categoryCode: s.category_code,
      count: s.count
    }))
    
    res.json({
      code: 200,
      data: {
        list: formattedDocuments,
        total: countResult.total,
        stats: stats
      }
    })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({ code: 500, message: '获取文件列表失败' })
  }
}

// 获取文件详情
export const getDocumentDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const documents = await query(`
      SELECT d.*, c.name as category_name, u.user_name as upload_user_name
      FROM pis_procedure_document d
      LEFT JOIN pis_document_category c ON d.category_code = c.code
      LEFT JOIN sys_user u ON d.upload_user_id = u.id
      WHERE d.id = ?
    `, [id])
    
    if (documents.length === 0) {
      return res.status(404).json({ code: 404, message: '文件不存在' })
    }
    
    res.json({ code: 200, data: documents[0] })
  } catch (error) {
    console.error('获取文件详情失败:', error)
    res.status(500).json({ code: 500, message: '获取文件详情失败' })
  }
}

// 更新文件信息
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params
    const { documentName, department, priority, sortNumber, status } = req.body
    
    await query(
      `UPDATE pis_procedure_document SET 
       document_name = ?, department = ?, priority = ?, 
       sort_number = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [documentName, department, priority, sortNumber, status, id]
    )
    
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('更新失败:', error)
    res.status(500).json({ code: 500, message: '更新失败' })
  }
}

// 上传文件
export const uploadProcedureDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '没有上传文件' })
    }
    
    const { documentId } = req.body
    const { filename, originalname, size } = req.file
    
    await query(
      `UPDATE pis_procedure_document SET 
       file_path = ?, upload_user_id = ?, upload_time = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [`/uploads/${filename}`, req.userId, documentId]
    )
    
    res.json({
      code: 200,
      message: '上传成功',
      data: { fileName: originalname, filePath: `/uploads/${filename}` }
    })
  } catch (error) {
    console.error('上传失败:', error)
    res.status(500).json({ code: 500, message: '上传失败' })
  }
}

// 获取所有部门列表（用于筛选）
export const getDepartments = async (req, res) => {
  try {
    const departments = await query(
      'SELECT DISTINCT department FROM pis_procedure_document WHERE department IS NOT NULL ORDER BY department'
    )
    res.json({ code: 200, data: departments.map(d => d.department) })
  } catch (error) {
    console.error('获取部门列表失败:', error)
    res.status(500).json({ code: 500, message: '获取部门列表失败' })
  }
}
