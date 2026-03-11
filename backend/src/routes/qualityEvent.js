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
  checkOverdue30DaysEvents
} from '../controllers/qualityEvent.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传目录
const uploadDir = path.join(__dirname, '../../uploads/quality-events')

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 临时上传目录
const tempUploadDir = path.join(__dirname, '../../uploads/temp')

// 确保临时目录存在
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true })
}

// 配置 multer 存储 - 先上传到临时目录，避免上传时阻塞
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 直接写入临时目录，不阻塞上传过程
    cb(null, tempUploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // 处理中文文件名 - 直接使用 originalname，不再重复解码
    // multer 已经从请求中正确解析了 utf8 文件名
    const ext = path.extname(file.originalname)
    const originalName = file.originalname
    // 存储文件名：时间戳_唯一ID_原始名称.扩展名
    const safeName = originalName.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
    cb(null, `${uniqueSuffix}_${safeName}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    // 获取原始文件名（处理伪装的情况）
    let checkName = file.originalname
    if (checkName.includes('|ORIGINAL:')) {
      checkName = checkName.split('|ORIGINAL:')[1]
    }
    
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.mp4', '.mov', '.3gp', '.m4v']
    const ext = path.extname(checkName).toLowerCase()
    
    if (allowedTypes.includes(ext)) {
      file.mimetype = 'application/octet-stream'
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${ext}`))
    }
  }
})

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

// 处理原生平台 base64 文件上传中间件
const handleBase64Upload = async (req, res, next) => {
  console.log('[Upload] handleBase64Upload called')
  console.log('[Upload] req.body:', req.body ? 'has body' : 'no body')
  
  // 检查是否为 base64 上传（原生平台）
  if (req.body && req.body.isBase64 && req.body.data) {
    console.log('[Upload] Detected base64 upload, filename:', req.body.filename)
    try {
      const { filename, type, size, data } = req.body
      
      // base64 解码
      const buffer = Buffer.from(data, 'base64')
      console.log('[Upload] Decoded buffer size:', buffer.length)
      
      // 生成临时文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const safeName = (filename || 'upload').replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
      const tempFilename = `${uniqueSuffix}_${safeName}`
      const tempPath = path.join(tempUploadDir, tempFilename)
      
      // 确保目录存在
      if (!fs.existsSync(tempUploadDir)) {
        fs.mkdirSync(tempUploadDir, { recursive: true })
      }
      
      // 写入临时文件
      fs.writeFileSync(tempPath, buffer)
      console.log('[Upload] File written to:', tempPath)
      
      // 模拟 multer req.files 格式
      req.files = [{
        fieldname: 'files',
        originalname: filename || 'upload',
        encoding: '7bit',
        mimetype: type || 'application/octet-stream',
        destination: tempUploadDir,
        filename: tempFilename,
        path: tempPath,
        size: buffer.length
      }]
      
      return next()
    } catch (error) {
      console.error('[Upload] Base64 文件处理失败:', error)
      return res.status(400).json({ code: 400, message: '文件处理失败: ' + error.message })
    }
  }
  
  console.log('[Upload] Not base64 upload, passing to multer')
  // 不是 base64 上传，继续 multer 处理
  next()
}

router.post('/:id/upload', handleBase64Upload, upload.array('files', 5), handleMulterError, uploadFiles)

// 管理员接口：手动触发超期30天事件检查
router.post('/admin/check-overdue-30days', async (req, res) => {
  try {
    // 检查是否为管理员
    const userId = req.userId
    const users = await query('SELECT role FROM sys_user WHERE id = ? AND deleted_at IS NULL', [userId])
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ code: 403, message: '只有管理员可以执行此操作' })
    }
    
    await checkOverdue30DaysEvents()
    res.json({ code: 200, message: '超期30天事件检查完成' })
  } catch (error) {
    console.error('手动触发超期30天检查失败:', error)
    res.status(500).json({ code: 500, message: '检查失败：' + error.message })
  }
})

export default router
