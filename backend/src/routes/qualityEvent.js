import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { operationLogMiddleware } from '../controllers/operationLog.js'
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
  uploadFiles
} from '../controllers/qualityEvent.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/quality-events')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
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
    return res.status(400).json({ code: 400, message: '文件格式不对' })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: '文件大小超过限制（最大500MB）' })
  }
  next(err)
}

router.post('/:id/upload', upload.array('files', 5), handleMulterError, uploadFiles)

export default router
