import express from 'express'
import * as proceduresController from '../controllers/procedures.js'
import multer from 'multer'

const router = express.Router()
const upload = multer()

// 文件上传路由
router.post('/procedure/upload', upload.single('file'), proceduresController.uploadProcedureFile)

export default router