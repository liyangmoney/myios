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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型，只允许 PDF/Word/Excel/PPT'))
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
router.post('/upload', upload.single('file'), uploadProcedureDocument)

export default router
