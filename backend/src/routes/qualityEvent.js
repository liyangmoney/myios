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
    const ext = path.extname(file.originalname)
    // 使用 Buffer 正确处理中文编码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
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
  // 检查是否为 base64 上传（原生平台）
  if (req.body && req.body.isBase64 && req.body.data) {
    try {
      const { filename, type, size, data } = req.body
      
      // base64 解码
      const buffer = Buffer.from(data, 'base64')
      
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
      console.error('Base64 文件处理失败:', error)
      return res.status(400).json({ code: 400, message: '文件处理失败: ' + error.message })
    }
  }
  
  // 不是 base64 上传，继续 multer 处理
  next()
}

router.post('/:id/upload', handleBase64Upload, upload.array('files', 5), handleMulterError, uploadFiles)

router.post('/:id/comments', operationLogMiddleware('质量事件', 'COMMENT', '添加评论'), addComment)

router.delete('/:id', operationLogMiddleware('质量事件', 'DELETE', '删除质量事件'), deleteQualityEvent)

// 临时路由：手动触发逾期提醒检查
router.get('/check/reminders', async (req, res) => {
  try {
    const reminderCount = await checkDueDateReminders()
    const overdueCount = await checkOverdue30DaysEvents()
    res.json({ 
      code: 200, 
      message: '检查完成', 
      data: { 
        reminderCount, 
        overdueCount 
      } 
    })
  } catch (error) {
    console.error('手动检查逾期提醒失败:', error)
    res.status(500).json({ code: 500, message: '检查失败: ' + error.message })
  }
})

export default router
