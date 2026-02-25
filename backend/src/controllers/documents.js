import { query } from '../config/database.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传文档
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '没有上传文件' })
    }
    
    const { projectId, recordId } = req.body
    const { originalname, filename, size, mimetype } = req.file
    
    const result = await query(
      `INSERT INTO pis_document 
       (project_id, record_id, doc_name, file_path, file_size, file_type, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, recordId || null, originalname, `/uploads/${filename}`, size, mimetype, req.userId]
    )
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        id: result.insertId,
        fileName: originalname,
        filePath: `/uploads/${filename}`
      }
    })
  } catch (error) {
    console.error('上传失败:', error)
    res.status(500).json({ code: 500, message: '上传失败' })
  }
}

// 删除文档
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params
    
    // 获取文件信息
    const docs = await query('SELECT * FROM pis_document WHERE id = ?', [id])
    
    if (docs.length === 0) {
      return res.status(404).json({ code: 404, message: '文档不存在' })
    }
    
    const doc = docs[0]
    
    // 删除文件
    const filePath = path.join(__dirname, '../../', doc.file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    // 删除记录
    await query('DELETE FROM pis_document WHERE id = ?', [id])
    
    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除失败:', error)
    res.status(500).json({ code: 500, message: '删除失败' })
  }
}

// 获取项目文档列表
export const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params
    
    const documents = await query(`
      SELECT d.*, u.user_name as uploaded_by_name
      FROM pis_document d
      LEFT JOIN sys_user u ON d.uploaded_by = u.id
      WHERE d.project_id = ?
      ORDER BY d.uploaded_at DESC
    `, [projectId])
    
    res.json({
      code: 200,
      data: documents
    })
  } catch (error) {
    console.error('获取文档列表失败:', error)
    res.status(500).json({ code: 500, message: '获取文档列表失败' })
  }
}
