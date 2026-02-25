import { query } from '../config/database.js'

export const getUsers = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, user_name, email, role FROM sys_user WHERE status = 1'
    )
    
    res.json({
      code: 200,
      data: users
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ code: 500, message: '获取用户列表失败' })
  }
}
