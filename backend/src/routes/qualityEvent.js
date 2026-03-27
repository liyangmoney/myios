import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { operationLogMiddleware } from '../controllers/operationLog.js'
import { query } from '../config/database.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  getQualityEvents,
  getQualityEventDetail,
  createQualityEvent,
  updateQualityEvent,
  deleteQualityEvent,
  addComment,
  getStatistics,
  uploadFiles,
  checkDueDateReminders,
  checkOverdueEvents
} from '../controllers/qualityEvent.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/quality-events')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 临时上传目录
const tempUploadDir = path.join(__dirname, '../../uploads/temp')
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true })
}

// 配置 multer 存储 - 按事件编号创建文件夹
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // 从 URL 参数获取事件ID
      const eventId = req.params.id
      
      let eventDir
      
      // 如果是临时上传（创建事件前），使用 temp 文件夹
      if (eventId === 'temp') {
        eventDir = path.join(uploadDir, 'temp')
      } else {
        // 查询事件编号
        const events = await query('SELECT event_no FROM quality_event WHERE id = ?', [eventId])
        const eventNo = events.length > 0 ? events[0].event_no : 'unknown'
        
        // 创建事件编号对应的文件夹
        eventDir = path.join(uploadDir, eventNo)
      }
      
      if (!fs.existsSync(eventDir)) {
        fs.mkdirSync(eventDir, { recursive: true })
      }
      
      cb(null, eventDir)
    } catch (error) {
      console.error('创建上传目录失败:', error)
      cb(error, uploadDir)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // 处理中文文件名，保留原始名称用于显示
    const ext = path.extname(file.originalname)
    // 使用 Buffer 正确处理中文编码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    // 存储文件名：原始名称_唯一ID.扩展名
    const safeName = originalName.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
    cb(null, `${uniqueSuffix}_${safeName}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.mp4']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

// 处理原生平台 base64 文件上传中间件
// 处理原生平台 base64 文件上传中间件
const handleBase64Upload = async (req, res, next) => {
  // 检查是否为 base64 上传（原生平台）
  if (req.body && req.body.isBase64 && req.body.data) {
    console.log('[handleBase64Upload] 安卓端 base64 上传')
    try {
      let { filename, type, size, data } = req.body
      
      // 处理中文编码
      if (typeof filename === 'string' && filename.includes('\\u')) {
        try { filename = JSON.parse('"' + filename + '"') } catch (e) {}
      }
      if (/[\ufffd\u00c0-\u00df]/.test(filename) || filename.includes('Ã')) {
        try { filename = Buffer.from(filename, 'latin1').toString('utf8') } catch (e) {}
      }
      
      // base64 解码
      const buffer = Buffer.from(data, 'base64')
      
      // 获取事件编号
      const eventId = req.params.id
      
      let eventDir
      if (eventId === 'temp') {
        // 临时上传，使用 temp 文件夹
        eventDir = path.join(uploadDir, 'temp')
      } else {
        // 查询事件编号
        const events = await query('SELECT event_no FROM quality_event WHERE id = ?', [eventId])
        const eventNo = events.length > 0 ? events[0].event_no : 'unknown'
        eventDir = path.join(uploadDir, eventNo)
      }
      
      // 创建事件目录（如果不存在）
      if (!fs.existsSync(eventDir)) {
        fs.mkdirSync(eventDir, { recursive: true })
      }
      
      // 生成文件名（和PC端multer一致）
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const originalName = filename || 'upload'
      const safeName = originalName.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
      const finalFilename = `${uniqueSuffix}_${safeName}`
      const finalPath = path.join(eventDir, finalFilename)
      
      // 直接写入文件（不经过temp目录，和PC端一致）
      fs.writeFileSync(finalPath, buffer)
      console.log('[handleBase64Upload] 已保存到:', finalPath)
      
      // 模拟 multer req.files 格式
      req.files = [{
        fieldname: 'files',
        originalname: originalName,
        encoding: '7bit',
        mimetype: type || 'application/octet-stream',
        destination: eventDir,
        filename: finalFilename,
        path: finalPath,
        size: buffer.length
      }]
      
      return next()
    } catch (error) {
      console.error('[handleBase64Upload] 失败:', error)
      return res.status(400).json({ code: 400, message: '文件处理失败: ' + error.message })
    }
  }
  
  // 不是 base64 上传，继续 multer 处理
  next()
}

const router = express.Router()

router.use(authMiddleware)

router.get('/', getQualityEvents)
router.get('/statistics', getStatistics)
router.get('/:id', getQualityEventDetail)
router.post('/', operationLogMiddleware('质量事件', 'CREATE', '创建质量事件'), createQualityEvent)
router.put('/:id', operationLogMiddleware('质量事件', 'UPDATE', '更新质量事件'), updateQualityEvent)
router.delete('/:id', operationLogMiddleware('质量事件', 'DELETE', '删除质量事件'), deleteQualityEvent)
router.post('/:id/comments', operationLogMiddleware('质量事件', 'COMMENT', '添加评论'), addComment)

// 错误处理中间件 - 处理 multer 文件类型错误
const handleMulterError = (err, req, res, next) => {
  if (err.message === '不支持的文件类型') {
    return res.status(400).send('文件格式不对')
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).send('文件大小超过限制（最大500MB）')
  }
  next(err)
}

router.post('/:id/upload', handleBase64Upload, upload.array('files', 5), handleMulterError, uploadFiles)

// 分片上传接口（安卓端使用）
// 存储分片上传任务
const chunkUploadTasks = new Map()

// 初始化分片上传
router.post('/:id/upload/init', authMiddleware, async (req, res) => {
  try {
    const { filename, type, size, totalChunks, uploadId } = req.body
    const eventId = req.params.id
    
    console.log('[ChunkUpload] Init:', { eventId, filename, size, totalChunks, uploadId })
    
    // 生成服务器端 uploadId
    const serverUploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 创建临时分片目录
    const chunkDir = path.join(tempUploadDir, serverUploadId)
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true })
    }
    
    // 存储上传任务信息
    chunkUploadTasks.set(serverUploadId, {
      eventId,
      filename,
      type,
      size,
      totalChunks,
      uploadedChunks: [],
      chunkDir,
      createdAt: Date.now()
    })
    
    res.json({ 
      code: 200, 
      data: { uploadId: serverUploadId },
      message: '初始化成功'
    })
  } catch (error) {
    console.error('[ChunkUpload] Init failed:', error)
    res.status(500).json({ code: 500, message: '初始化失败：' + error.message })
  }
})

// 上传分片
router.post('/:id/upload/chunk', authMiddleware, async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks } = req.query
    
    if (!uploadId || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }
    
    const task = chunkUploadTasks.get(uploadId)
    if (!task) {
      return res.status(404).json({ code: 404, message: '上传任务不存在或已过期' })
    }
    
    // 保存分片
    const chunkPath = path.join(task.chunkDir, `chunk-${chunkIndex}`)
    
    // 获取请求体的原始数据
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      const buffer = Buffer.concat(chunks)
      fs.writeFileSync(chunkPath, buffer)
      
      // 更新已上传分片列表
      if (!task.uploadedChunks.includes(parseInt(chunkIndex))) {
        task.uploadedChunks.push(parseInt(chunkIndex))
      }
      
      console.log(`[ChunkUpload] Chunk ${chunkIndex}/${totalChunks} saved, size: ${buffer.length}`)
      
      res.json({ 
        code: 200, 
        data: { chunkIndex, status: 'success' },
        message: `分片 ${chunkIndex} 上传成功`
      })
    })
    
  } catch (error) {
    console.error('[ChunkUpload] Chunk upload failed:', error)
    res.status(500).json({ code: 500, message: '分片上传失败：' + error.message })
  }
})

// 合并分片
router.post('/:id/upload/merge', authMiddleware, async (req, res) => {
  try {
    const { uploadId } = req.query
    const { filename, type, size, totalChunks } = req.body
    const eventId = req.params.id
    
    console.log('[ChunkUpload] Merge:', { uploadId, filename, totalChunks })
    
    const task = chunkUploadTasks.get(uploadId)
    if (!task) {
      return res.status(404).json({ code: 404, message: '上传任务不存在或已过期' })
    }
    
    // 检查是否所有分片都已上传
    if (task.uploadedChunks.length !== parseInt(totalChunks)) {
      return res.status(400).json({ 
        code: 400, 
        message: `分片不完整：已上传 ${task.uploadedChunks.length}/${totalChunks}` 
      })
    }
    
    // 获取事件编号
    let eventDir
    if (eventId === 'temp') {
      eventDir = path.join(uploadDir, 'temp')
    } else {
      const events = await query('SELECT event_no FROM quality_event WHERE id = ?', [eventId])
      const eventNo = events.length > 0 ? events[0].event_no : 'unknown'
      eventDir = path.join(uploadDir, eventNo)
    }
    
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true })
    }
    
    // 生成最终文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(filename)
    const safeName = filename.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
    const finalFilename = `${uniqueSuffix}_${safeName}`
    const finalPath = path.join(eventDir, finalFilename)
    
    // 合并分片
    const writeStream = fs.createWriteStream(finalPath)
    for (let i = 0; i < parseInt(totalChunks); i++) {
      const chunkPath = path.join(task.chunkDir, `chunk-${i}`)
      const chunkBuffer = fs.readFileSync(chunkPath)
      writeStream.write(chunkBuffer)
    }
    writeStream.end()
    
    // 等待写入完成
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    
    // 清理分片文件
    fs.rmSync(task.chunkDir, { recursive: true, force: true })
    chunkUploadTasks.delete(uploadId)
    
    // 生成文件 URL
    const eventNo = eventId === 'temp' ? 'temp' : (await query('SELECT event_no FROM quality_event WHERE id = ?', [eventId]))[0]?.event_no || 'unknown'
    const fileUrl = `/uploads/quality-events/${eventNo}/${finalFilename}`
    
    console.log('[ChunkUpload] Merge complete:', finalPath)
    
    res.json({
      code: 200,
      data: [{
        name: filename,
        url: fileUrl,
        size: parseInt(size),
        type: type
      }],
      message: '文件合并成功'
    })
  } catch (error) {
    console.error('[ChunkUpload] Merge failed:', error)
    res.status(500).json({ code: 500, message: '合并失败：' + error.message })
  }
})

// 删除临时文件
router.delete('/temp/file/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadDir, 'temp', filename)
    
    // 安全检查：确保文件路径在 temp 目录内
    const resolvedPath = path.resolve(filePath)
    const resolvedTempDir = path.resolve(path.join(uploadDir, 'temp'))
    if (!resolvedPath.startsWith(resolvedTempDir)) {
      return res.status(400).json({ code: 400, message: '非法文件路径' })
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ code: 200, message: '文件删除成功' })
    } else {
      res.json({ code: 200, message: '文件不存在或已删除' })
    }
  } catch (error) {
    console.error('删除临时文件失败:', error)
    res.status(500).json({ code: 500, message: '删除失败：' + error.message })
  }
})

// 管理员接口：手动触发超期30天事件检查
router.post('/admin/check-overdue-30days', async (req, res) => {
  try {
    // 检查是否为管理员
    const userId = req.userId
    const users = await query('SELECT role FROM sys_user WHERE id = ? AND deleted_at IS NULL', [userId])
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以执行此操作' })
    }
    
    await checkOverdueEvents()
    res.json({ code: 200, message: '超期30天事件检查完成' })
  } catch (error) {
    console.error('手动触发超期30天检查失败:', error)
    res.status(500).json({ code: 500, message: '检查失败：' + error.message })
  }
})

export default router
