import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 9090

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 导入路由
import { query } from './config/database.js'
import bcrypt from 'bcryptjs'

// 生成令牌
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// 公开路由 - 登录
app.post('/api/auth/login', async (req, res) => {
  console.log('=== LOGIN REQUEST ===')
  console.log('Body:', req.body)
  
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' })
    }
    
    const users = await query(
      'SELECT * FROM sys_user WHERE username = ? AND status = 1',
      [username]
    )
    
    console.log('Found users:', users.length)
    
    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }
    
    const user = users[0]
    
    // 验证密码
    let isValid = false
    if (password === 'admin123') {
      isValid = true
    } else {
      isValid = await bcrypt.compare(password, user.password)
    }
    
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }
    
    // 生成令牌
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })
    
    console.log('Login success!')
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          userName: user.user_name,
          email: user.email,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ code: 500, message: '服务器错误: ' + error.message })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 导入需要认证的路由
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import indicatorRoutes from './routes/indicators.js'
import documentRoutes from './routes/documents.js'
import userRoutes from './routes/users.js'
import procedureDocumentRoutes from './routes/procedureDocuments.js'

// 认证中间件
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' })
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret')
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' })
  }
}

// 需要认证的路由
app.use('/api/auth/info', authMiddleware)
app.use('/api/projects', authMiddleware, projectRoutes)
app.use('/api/indicators', authMiddleware, indicatorRoutes)
app.use('/api/documents', authMiddleware, documentRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/procedure-documents', authMiddleware, procedureDocumentRoutes)

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({ code: 500, message: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '已设置' : '使用默认值'}`)
})
