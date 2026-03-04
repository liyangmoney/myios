import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { operationLogMiddleware } from '../controllers/operationLog.js'
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
  downloadArchive,
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

// 公开下载接口（不认证，通过文件名随机性保证安全）
router.get('/archive-download/:fileName', downloadArchive)

router.use(authMiddleware)

router.get('/', getProcedures)
router.get('/years', getAvailableYears)
router.get('/statistics', getAnnualStatistics)
router.post('/archive', operationLogMiddleware('程序文件', 'ARCHIVE', '归档年度文件'), archiveYearFiles)
router.post('/copy-year', operationLogMiddleware('程序文件', 'COPY', '复制年度文件'), copyYearFiles)
router.get('/departments', getDepartments)
router.get('/:id', getProcedureDetail)
router.post('/records', operationLogMiddleware('程序文件', 'CREATE', '创建记录'), createRecord)
router.put('/records/:id', operationLogMiddleware('程序文件', 'UPDATE', '修改记录'), updateRecord)
router.delete('/records/:id', operationLogMiddleware('程序文件', 'DELETE', '删除记录'), deleteRecord)
router.post('/persons', operationLogMiddleware('程序文件', 'CREATE', '添加人员'), addPerson)
router.delete('/persons/:id', operationLogMiddleware('程序文件', 'DELETE', '删除人员'), deletePerson)

// 错误处理中间件 - 处理 multer 文件类型错误
const handleMulterError = (err, req, res, next) => {
  if (err.message === '不支持的文件类型') {
    return res.status(400).json({ code: 400, message: '文件格式不对' })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: '文件大小超过限制（最大50MB）' })
  }
  next(err)
}

router.post('/upload', operationLogMiddleware('程序文件', 'UPLOAD', '上传文件'), upload.single('file'), handleMulterError, uploadProcedureFile)

export default router
