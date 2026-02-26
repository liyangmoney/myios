import { query } from '../config/database.js'
import path from 'path'

// OnlyOffice 配置
const ONLYOFFICE_SERVER = process.env.ONLYOFFICE_URL || 'http://localhost:9000'

// 获取文档预览/编辑配置
export const getDocumentConfig = async (req, res) => {
  try {
    const { recordId } = req.params
    
    // 获取记录信息
    const records = await query(`
      SELECT r.*, p.file_name as procedure_name
      FROM procedure_file_record r
      JOIN procedure_file p ON r.procedure_file_id = p.id
      WHERE r.id = ?
    `, [recordId])
    
    if (records.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在' })
    }
    
    const record = records[0]
    
    if (!record.file_path) {
      return res.status(400).json({ code: 400, message: '文件尚未上传' })
    }
    
    // 获取文件扩展名
    const ext = path.extname(record.file_path).toLowerCase().replace('.', '')
    
    // 支持的文件类型
    const documentTypes = {
      'doc': 'word',
      'docx': 'word',
      'xls': 'cell',
      'xlsx': 'cell',
      'ppt': 'slide',
      'pptx': 'slide',
      'pdf': 'pdf'
    }
    
    const documentType = documentTypes[ext] || 'word'
    const fileName = path.basename(record.file_path)
    
    // 构建完整文件URL
    const serverHost = `${req.protocol}://${req.get('host')}`
    const fileUrl = `${serverHost}${record.file_path}`
    
    // 构建 OnlyOffice 配置
    const config = {
      document: {
        fileType: ext,
        key: `record_${recordId}_${Date.now()}`,
        title: fileName,
        url: fileUrl,
        permissions: {
          edit: true,
          download: true
        }
      },
      documentType: documentType,
      editorConfig: {
        callbackUrl: `${serverHost}/api/onlyoffice/callback/${recordId}`,
        lang: 'zh-CN',
        mode: 'edit',
        user: {
          id: req.userId?.toString() || 'guest',
          name: req.userName || '用户'
        }
      },
      serverUrl: ONLYOFFICE_SERVER
    }
    
    res.json({ code: 200, data: config })
    
  } catch (error) {
    console.error('获取文档配置失败:', error)
    res.status(500).json({ code: 500, message: '获取文档配置失败' })
  }
}

// OnlyOffice 保存回调
export const documentCallback = async (req, res) => {
  try {
    const { recordId } = req.params
    const { status, url } = req.body
    
    // status: 0 - 无变化, 1 - 编辑中, 2 - 准备保存, 3 - 保存错误, 4 - 文档关闭, 6 - 保存完成, 7 - 保存失败
    if (status === 2 || status === 6) {
      // 文档已保存，更新文件路径（如果有新URL）
      if (url) {
        // 下载新文件并保存
        // 这里可以下载 OnlyOffice 保存的文件并替换本地文件
        console.log('文档已保存:', url)
      }
      
      // 更新记录状态
      await query(
        `UPDATE procedure_file_record 
         SET updated_at = NOW(), status = 'UPLOADED'
         WHERE id = ?`,
        [recordId]
      )
      
      return res.json({ error: 0 })
    }
    
    res.json({ error: 0 })
    
  } catch (error) {
    console.error('文档回调处理失败:', error)
    res.json({ error: 1, message: error.message })
  }
}