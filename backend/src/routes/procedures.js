import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getProcedures,
  getProcedureDetail,
  createRecord,
  updateRecord,
  deleteRecord,
  getDepartments,
  addPerson,
  deletePerson
} from '../controllers/procedures.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/records'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
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

router.get('/', getProcedures)
router.get('/departments', getDepartments)
router.get('/:id', getProcedureDetail)
router.post('/records', createRecord)
router.put('/records/:id', updateRecord)
router.delete('/records/:id', deleteRecord)
router.post('/persons', addPerson)
router.delete('/persons/:id', deletePerson)
router.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    code: 200,
    message: '上传成功',
    data: { filePath: `/uploads/records/${req.file.filename}` }
  })
})

export default router
