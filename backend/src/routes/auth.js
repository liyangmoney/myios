import express from 'express'
import { login, getUserInfo } from '../controllers/auth.js'
import { authMiddleware } from '../utils/auth.js'

const router = express.Router()

// 登录接口 - 公开访问
router.post('/login', (req, res, next) => {
  console.log('Login route hit:', req.body)
  next()
}, login)

// 获取用户信息 - 需要认证
router.get('/info', authMiddleware, getUserInfo)

export default router
