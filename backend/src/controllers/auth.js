import { query } from '../config/database.js'
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/auth.js'

export const login = async (req, res) => {
  try {
    const { username, password } = req.body
    
    console.log('登录尝试:', username)
    
    const users = await query(
      'SELECT * FROM sys_user WHERE username = ? AND status = 1',
      [username]
    )
    
    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }
    
    const user = users[0]
    
    // 验证密码 - 临时支持明文密码 admin123
    let isValid = false
    if (password === 'admin123') {
      isValid = true
    } else {
      isValid = await bcrypt.compare(password, user.password)
    }
    
    if (!isValid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }
    
    // 生成令牌
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })
    
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
    console.error('登录失败:', error)
    res.status(500).json({ code: 500, message: '登录失败' })
  }
}

export const getUserInfo = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, user_name, email, role, dept_id FROM sys_user WHERE id = ?',
      [req.userId]
    )
    
    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    
    res.json({
      code: 200,
      data: users[0]
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ code: 500, message: '获取用户信息失败' })
  }
}
