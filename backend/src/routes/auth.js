import express from 'express'
import { login, getUserInfo } from '../controllers/auth.js'
import { authMiddleware } from '../utils/auth.js'

const router = express.Router()

router.post('/login', login)
router.get('/info', authMiddleware, getUserInfo)

export default router
