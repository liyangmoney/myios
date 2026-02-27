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
  deletePerson,
  uploadProcedureFile,
  getAvailableYears,
  getAnnualStatistics,
  archiveYearFiles,
  copyYearFiles
} from '../controllers/procedures.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 使用内存存储，让控制器处理文件保存逻辑
const upload = multer({
  storage: multer.memoryStorage(),
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
router.get('/years', getAvailableYears)
router.get('/statistics', getAnnualStatistics)
router.post('/archive', archiveYearFiles)
router.post('/copy-year', copyYearFiles)
router.get('/departments', getDepartments)
router.get('/:id', getProcedureDetail)
router.post('/records', createRecord)
router.put('/records/:id', updateRecord)
router.delete('/records/:id', deleteRecord)
router.post('/persons', addPerson)
router.delete('/persons/:id', deletePerson)
router.post('/upload', upload.single('file'), uploadProcedureFile)

export default router
