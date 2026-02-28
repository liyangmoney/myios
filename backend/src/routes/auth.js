import express from 'express'
import { login, getUserInfo } from '../controllers/auth.js'
import { authMiddleware } from '../utils/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

// 登录接口 - 公开访问
router.post('/login', (req, res, next) => {
  console.log('Login route hit:', req.body)
  next()
}, login)

// 获取用户信息 - 需要认证
router.get('/info', authMiddleware, getUserInfo)

// 登出接口 - 需要认证，记录登出日志
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // 记录登出日志
    await query(`
      INSERT INTO sys_operation_log 
      (user_id, username, user_name, module, action, description, ip_address, user_agent, status)
      VALUES (?, ?, ?, '登录', 'LOGOUT', '用户登出', ?, ?, 1)
    `, [
      req.userId,
      req.user?.username || req.userName,
      req.userName,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    ])
    
    res.json({ code: 200, message: '登出成功' })
  } catch (error) {
    console.error('记录登出日志失败:', error)
    res.json({ code: 200, message: '登出成功' })
  }
})

export default router
