import { query } from '../config/database.js'
import bcrypt from 'bcryptjs'
import { sendNewUserEmail } from '../utils/mail.js'

// 获取用户列表
export const getUsers = async (req, res) => {
  try {
    const { keyword, department, role, page = 1, pageSize = 10 } = req.query
    
    // 确保分页参数是有效数字 - 强制转换为整数
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 10)
    const offset = (pageNum - 1) * pageSizeNum
    
    console.log('分页参数:', { page, pageSize, pageNum, pageSizeNum, offset })
    
    let sql = `
      SELECT u.id, u.username, u.user_name, u.email, u.phone, 
             u.department, u.role, u.status, u.created_at, u.remark,
             u.is_dept_leader, u.job_title,
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
    
    // 分页 - 使用显式整数
    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSizeNum), Number(offset))
    
    console.log('SQL:', sql)
    console.log('Params:', params, 'Types:', params.map(p => typeof p))
    
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
        page: pageNum,
        pageSize: pageSizeNum
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ code: 500, message: '获取用户列表失败：' + error.message })
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

// 创建用户
export const createUser = async (req, res) => {
  try {
    const { username, userName, password, email, phone, department, role = 'user', remark, isDeptLeader, jobTitle } = req.body
    const createdBy = req.userId
    
    // 校验必填项
    if (!username || !userName || !password || !email) {
      return res.status(400).json({ code: 400, message: '用户名、姓名、密码和邮箱不能为空' })
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码长度至少 6 位' })
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
    
    // 如果勾选为部门领导，职称必填
    if (isDeptLeader && !jobTitle) {
      return res.status(400).json({ code: 400, message: '部门领导必须填写职称' })
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // 插入用户
    const result = await query(`
      INSERT INTO sys_user (username, password, user_name, email, phone, department, role, status, created_by, remark, is_dept_leader, job_title)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `, [username, hashedPassword, userName, email, phone || null, department || null, role, createdBy, remark || null, isDeptLeader ? 1 : 0, jobTitle || null])
    
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
      }, password)
    }
    
    res.json({
      code: 200,
      message: '用户创建成功',
      data: {
        id: newUserId,
        username,
        userName,
        emailSent: emailResult?.success || false
      }
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    res.status(500).json({ code: 500, message: '创建用户失败：' + error.message })
  }
}

// 更新用户
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { userName, email, phone, department, role, status, remark, isDeptLeader, jobTitle } = req.body
    
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
    
    // 如果勾选为部门领导，职称必填
    if (isDeptLeader && !jobTitle) {
      return res.status(400).json({ code: 400, message: '部门领导必须填写职称' })
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
        is_dept_leader = ?,
        job_title = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [userName, email, phone, department, role, status, remark, isDeptLeader ? 1 : 0, jobTitle || null, id])
    
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

// 修改密码
// 管理员可以修改任何用户密码，普通用户只能修改自己的密码（需验证旧密码）
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params
    const { oldPassword, newPassword } = req.body
    const currentUserId = req.userId
    const currentUserRole = req.userRole
    
    // 检查用户是否存在
    const user = await query('SELECT id, username, password FROM sys_user WHERE id = ? AND deleted_at IS NULL', [id])
    if (user.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    
    const targetUser = user[0]
    const isAdmin = currentUserRole === 'admin'
    const isSelf = parseInt(id) === currentUserId
    
    // 权限检查：管理员可以修改任何人，普通用户只能修改自己
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ code: 403, message: '无权修改其他用户的密码' })
    }
    
    // 普通用户修改自己密码时需要验证旧密码
    if (!isAdmin && isSelf) {
      if (!oldPassword) {
        return res.status(400).json({ code: 400, message: '请输入旧密码' })
      }
      
      // 验证旧密码
      const isValid = await bcrypt.compare(oldPassword, targetUser.password)
      if (!isValid) {
        return res.status(400).json({ code: 400, message: '旧密码不正确' })
      }
    }
    
    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ code: 400, message: '新密码长度至少 6 位' })
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // 更新密码
    await query('UPDATE sys_user SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, id])
    
    res.json({
      code: 200,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ code: 500, message: '修改密码失败：' + error.message })
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
