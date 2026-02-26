import express from 'express'
import { getDocumentConfig, documentCallback } from '../controllers/onlyoffice.js'
import { authMiddleware } from '../utils/auth.js'

const router = express.Router()

// 获取文档配置 - 需要认证
router.get('/config/:recordId', authMiddleware, getDocumentConfig)

// OnlyOffice 回调 - 不需要认证（OnlyOffice 服务器调用）
router.post('/callback/:recordId', documentCallback)

export default router