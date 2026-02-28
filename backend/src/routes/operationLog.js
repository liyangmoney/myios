import express from 'express'
import { authMiddleware } from '../utils/auth.js'
import { getOperationLogs, getModules } from '../controllers/operationLog.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getOperationLogs)
router.get('/modules', getModules)

export default router
