import { query } from '../config/database.js'
import bcrypt from 'bcryptjs'
import { sendNewUserEmail } from '../utils/mail.js'

// 获取用户列表
export const getUsers = async (req, res) => {
  try {
    const { keyword, department, role, page = 1, pageSize = 10 } = req.query
    
    let sql = `
      SELECT u.id, u.username, u.user_name, u.email, u.phone, 
             u.department, u.role, u.status, u.created_at, u.remark,
             creator.user_name as created_by_name
      FROM sys_user u
      LEFT JOIN sys_user creator ON u.created_by = creator.id
      WHERE u.deleted_at IS NULL
    `
    const params = []
    
    if (keyword) {
      sql += ' AND (u.username LIKE ? OR u.user_name LIKE ? OR u.email LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    if (department) {
      sql += ' AND u.department = ?'
      params.push(department)
    }
    
    if (role) {
      sql += ' AND u.role = ?'
      params.push(role)
    }
    
    sql += ' ORDER BY u.created_at DESC'
    
    // 分页
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), offset)
    
    const users = await query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM sys_user WHERE deleted_at IS NULL'
    const countParams = []
    
    if (keyword) {
      countSql += ' AND (username LIKE ? OR user_name LIKE ? OR email LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (department) {
      countSql += ' AND department = ?'
      countParams.push(department)
    }
    if (role) {
      countSql += ' AND role = ?'
      countParams.push(role)
    }
    
    const countResult = await query(countSql, countParams)
    
    res.json({
      code: 200,
      data: {
        list: users,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ code: 500, message: '获取用户列表失败' })
  }
}

// 获取用户详情
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const users = await query(`
      SELECT id, username, user_name, email, phone, department, role, status, remark, created_at
      FROM sys_user
      WHERE id = ? AND deleted_at IS NULL
    `, [id])
    
    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    
    res.json({ code: 200, data: users[0] })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    res.status(500).json({ code: 500, message: '获取用户详情失败' })
  }
}

// 生成随机密码
const generateRandomPassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// 创建用户
export const createUser = async (req, res) => {
  try {
    const { username, userName, email, phone, department, role = 'user', remark } = req.body
    const createdBy = req.userId
    
    // 校验必填项
    if (!username || !userName || !email) {
      return res.status(400).json({ code: 400, message: '用户名、姓名和邮箱不能为空' })
    }
    
    // 检查用户名是否已存在
    const existingUser = await query(
      'SELECT id FROM sys_user WHERE username = ? AND deleted_at IS NULL',
      [username]
    )
    
    if (existingUser.length > 0) {
      return res.status(400).json({ code: 400, message: '用户名已存在' })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await query(
      'SELECT id FROM sys_user WHERE email = ? AND deleted_at IS NULL',
      [email]
    )
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ code: 400, message: '邮箱已被使用' })
    }
    
    // 生成随机初始密码
    const plainPassword = generateRandomPassword(10)
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    
    // 插入用户
    const result = await query(`
      INSERT INTO sys_user (username, password, user_name, email, phone, department, role, status, created_by, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `, [username, hashedPassword, userName, email, phone || null, department || null, role, createdBy, remark || null])
    
    const newUserId = result.insertId
    
    // 发送邮件通知
    let emailResult = null
    if (email) {
      emailResult = await sendNewUserEmail({
        username,
        userName,
        email,
        department,
        role
      }, plainPassword)
    }
    
    res.json({
      code: 200,
      message: '用户创建成功',
      data: {
        id: newUserId,
        username,
        userName,
        initialPassword: plainPassword, // 仅在创建时返回一次
        emailSent: emailResult?.success || false
      }
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    res.status(500).json({ code: 500, message: '创建用户失败: ' + error.message })
  }
}

// 更新用户
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { userName, email, phone, department, role, status, remark } = req.body
    
    // 检查用户是否存在
    const user = await query('SELECT id FROM sys_user WHERE id = ? AND deleted_at IS NULL', [id])
    if (user.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    
    // 检查邮箱是否被其他用户使用
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM sys_user WHERE email = ? AND id != ? AND deleted_at IS NULL',
        [email, id]
      )
      if (existingEmail.length > 0) {
        return res.status(400).json({ code: 400, message: '邮箱已被其他用户使用' })
      }
    }
    
    await query(`
      UPDATE sys_user SET
        user_name = ?,
        email = ?,
        phone = ?,
        department = ?,
        role = ?,
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [userName, email, phone, department, role, status, remark, id])
    
    res.json({ code: 200, message: '用户更新成功' })
  } catch (error) {
    console.error('更新用户失败:', error)
    res.status(500).json({ code: 500, message: '更新用户失败' })
  }
}

// 删除用户（软删除）
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    
    // 不能删除自己
    if (parseInt(id) === req.userId) {
      return res.status(400).json({ code: 400, message: '不能删除当前登录用户' })
    }
    
    const user = await query('SELECT id FROM sys_user WHERE id = ? AND deleted_at IS NULL', [id])
    if (user.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    
    await query('UPDATE sys_user SET deleted_at = NOW() WHERE id = ?', [id])
    
    res.json({ code: 200, message: '用户删除成功' })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({ code: 500, message: '删除用户失败' })
  }
}

// 重置密码
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await query('SELECT id, username, user_name, email FROM sys_user WHERE id = ? AND deleted_at IS NULL', [id])
    if (user.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    
    // 生成新密码
    const plainPassword = generateRandomPassword(10)
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    
    await query('UPDATE sys_user SET password = ? WHERE id = ?', [hashedPassword, id])
    
    // 发送邮件通知
    let emailResult = null
    if (user[0].email) {
      emailResult = await sendNewUserEmail({
        username: user[0].username,
        userName: user[0].user_name,
        email: user[0].email,
        department: user[0].department,
        role: user[0].role
      }, plainPassword)
    }
    
    res.json({
      code: 200,
      message: '密码重置成功',
      data: {
        newPassword: plainPassword,
        emailSent: emailResult?.success || false
      }
    })
  } catch (error) {
    console.error('重置密码失败:', error)
    res.status(500).json({ code: 500, message: '重置密码失败' })
  }
}

// 获取部门列表
export const getDepartments = async (req, res) => {
  try {
    const departments = await query(`
      SELECT id, dept_name, dept_code, parent_id, sort_order
      FROM sys_department
      WHERE status = 1
      ORDER BY sort_order ASC
    `)
    
    res.json({ code: 200, data: departments })
  } catch (error) {
    console.error('获取部门列表失败:', error)
    res.status(500).json({ code: 500, message: '获取部门列表失败' })
  }
}