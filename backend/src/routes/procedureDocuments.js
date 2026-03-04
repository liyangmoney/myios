import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getCategories,
  getDocuments,
  getDocumentDetail,
  updateDocument,
  uploadProcedureDocument,
  getDepartments
} from '../controllers/procedureDocuments.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/procedures'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.mp4']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型，只允许 PDF/Word/Excel/PPT/MP4'))
    }
  }
})

const router = express.Router()

router.use(authMiddleware)

router.get('/categories', getCategories)
router.get('/departments', getDepartments)
router.get('/', getDocuments)
router.get('/:id', getDocumentDetail)
router.put('/:id', updateDocument)

// 错误处理中间件 - 处理 multer 文件类型错误
const handleMulterError = (err, req, res, next) => {
  if (err.message && err.message.includes('不支持的文件类型')) {
    return res.status(400).json({ code: 400, message: '文件格式不对' })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: '文件大小超过限制（最大500MB）' })
  }
  next(err)
}

router.post('/upload', upload.single('file'), handleMulterError, uploadProcedureDocument)

export default router
