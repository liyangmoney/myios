// 临时重置 admin 密码脚本
// 运行：node reset-admin.js

import { query } from './src/config/database.js'
import bcrypt from 'bcryptjs'

async function resetAdminPassword() {
  try {
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    await query(
      'UPDATE sys_user SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    )
    
    console.log('✅ admin 密码已重置为：admin123')
    console.log('加密后的密码：', hashedPassword)
    process.exit(0)
  } catch (error) {
    console.error('❌ 重置失败：', error)
    process.exit(1)
  }
}

resetAdminPassword()
