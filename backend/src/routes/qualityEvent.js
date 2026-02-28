import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { operationLogMiddleware } from '../controllers/operationLog.js'
import multer from 'multer'
import path from 'path'
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

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/quality-events'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, 'qe-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
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
router.post('/:id/upload', upload.array('files', 5), uploadFiles)

export default router
