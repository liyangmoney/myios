import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'

// 确保上传目录存在
import './config/upload.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 9090

// 中间件 - CORS 配置，允许所有来源
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))

// 显式处理 OPTIONS 预检请求
app.options('*', cors())

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 设置响应编码为 UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

// 健康检查接口（用于测试连通性）
app.get('/ping', (req, res) => {
  res.json({ code: 200, message: 'pong', timestamp: new Date().toISOString() })
})

// 静态文件 - 上传的文件需要公开访问（OnlyOffice 需要）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 文件下载接口
app.get('/api/download', (req, res) => {
  const { filename } = req.query
  if (!filename) {
    return res.status(400).json({ code: 400, message: '缺少文件名参数' })
  }
  
  // 安全检查：只允许下载 uploads/quality-events 目录下的文件
  const safePath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '')
  const filePath = path.join(__dirname, '../uploads/quality-events', safePath)
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ code: 404, message: '文件不存在' })
  }
  
  // 提取原始文件名（去掉时间戳前缀）
  const pathParts = safePath.split('/')
  const actualFilename = pathParts[pathParts.length - 1] // 获取最后一部分（文件名）
  const originalName = actualFilename.replace(/^\d+-\d+_/, '')
  
  // 发送文件，设置下载文件名
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`)
  res.sendFile(filePath)
})

// 文件删除接口
app.delete('/api/files', (req, res) => {
  const { filename } = req.body
  if (!filename) {
    return res.status(400).json({ code: 400, message: '缺少文件名参数' })
  }
  
  // 安全检查：只允许删除 uploads/quality-events 目录下的文件
  const safePath = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '')
  const filePath = path.join(__dirname, '../uploads/quality-events', safePath)
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ code: 404, message: '文件不存在' })
  }
  
  // 删除文件
  try {
    fs.unlinkSync(filePath)
    res.json({ code: 200, message: '文件删除成功' })
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({ code: 500, message: '文件删除失败' })
  }
})

// 文件预览接口
app.get('/api/preview', (req, res) => {
  const { url } = req.query
  if (!url) {
    return res.status(400).json({ code: 400, message: '缺少文件URL参数' })
  }
  
  const ext = path.extname(url).toLowerCase()
  
  // PDF 直接在新窗口打开
  if (ext === '.pdf') {
    return res.json({ 
      code: 200, 
      data: { 
        previewType: 'direct',
        previewUrl: url 
      } 
    })
  }
  
  // Word/Excel/PPT 本地预览不支持，提示下载
  const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  if (officeExts.includes(ext)) {
    return res.json({ 
      code: 200, 
      data: { 
        previewType: 'download',
        message: 'Office文件暂不支持在线预览，请下载后查看'
      } 
    })
  }
  
  // 其他文件不支持预览
  res.status(400).json({ code: 400, message: '该文件类型不支持在线预览' })
})

// 健康检查接口（用于 Zeabur 等平台的健康检测）
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

import { version, updateLog, forceUpdate, minVersion } from '../config/version.js'

// ... existing code ...

// APP 版本检查接口
app.get('/api/app/version', (req, res) => {
  res.json({
    code: 200,
    data: {
      version,
      apkUrl: `${process.env.APP_URL || 'http://myjghy.myds.me:9090'}/app/pis-latest.apk`,
      updateLog,
      forceUpdate,
      minVersion
    }
  })
})

// APP APK 下载接口
app.get('/app/:filename', (req, res) => {
  const { filename } = req.params
  const apkPath = path.join(__dirname, '../app', filename)
  
  // 安全检查：只允许访问 app 目录下的文件
  if (!filename.endsWith('.apk')) {
    return res.status(400).json({ code: 400, message: '只允许下载 APK 文件' })
  }
  
  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({ code: 404, message: 'APK 文件不存在' })
  }
  
  // 发送 APK 文件
  res.setHeader('Content-Type', 'application/vnd.android.package-archive')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.sendFile(apkPath)
})

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
      'SELECT * FROM sys_user WHERE username = ? AND status = 1 AND deleted_at IS NULL',
      [username]
    )
    
    console.log('Found users:', users.length)
    
    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }
    
    const user = users[0]
    
    // 临时重置功能：如果密码是 RESET，则重置为 admin123
    if (username === 'admin' && password === 'RESET') {
      const newHash = await bcrypt.hash('admin123', 10)
      await query('UPDATE sys_user SET password = ? WHERE username = ?', [newHash, 'admin'])
      console.log('Admin 密码已重置为 admin123')
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)
    
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
    
    // 记录登录日志
    try {
      await query(`
        INSERT INTO sys_operation_log 
        (user_id, username, user_name, module, action, description, ip_address, user_agent, status)
        VALUES (?, ?, ?, '登录', 'LOGIN', '用户登录', ?, ?, 1)
      `, [
        user.id, user.username, user.user_name,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']
      ])
    } catch (logError) {
      console.error('记录登录日志失败:', logError)
    }
    
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
import procedureRoutes from './routes/procedures.js'
import onlyofficeRoutes from './routes/onlyoffice.js'
import operationLogRoutes from './routes/operationLog.js'
import qualityEventRoutes from './routes/qualityEvent.js'
import uploadRoutes from './routes/upload.js'
import { operationLogMiddleware } from './controllers/operationLog.js'

// 认证中间件
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' })
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret')
    req.userId = decoded.userId
    req.userRole = decoded.role
    
    // 获取用户信息
    const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [decoded.userId])
    req.userName = users[0]?.user_name || decoded.username || '用户'
    
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' })
  }
}

// 需要认证的路由
app.use('/api/auth/info', authMiddleware)
app.use('/api/projects', projectRoutes)
app.use('/api/indicators', indicatorRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/operation-logs', operationLogRoutes)
app.use('/api/quality-events', qualityEventRoutes)
app.use('/api/upload', uploadRoutes)
// procedures 路由内部自己处理认证
app.use('/api/procedures', procedureRoutes)
// OnlyOffice 回调不需要认证（OnlyOffice 服务器调用）
app.use('/api/onlyoffice', onlyofficeRoutes)

// 导入定时任务
import { startAllQualityEventJobs } from './jobs/qualityEventReminder.js'

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({ code: 500, message: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '已设置' : '使用默认值'}`)
  
  // 启动所有定时任务
  startAllQualityEventJobs()
})
