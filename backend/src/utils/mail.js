import nodemailer from 'nodemailer'

// 163邮箱配置
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'your_email@163.com',
    pass: process.env.EMAIL_PASS || 'your_auth_code'
  }
})

/**
 * 发送邮件
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件内容（HTML格式）
 */
export const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"PIS系统" <${process.env.EMAIL_USER || 'your_email@163.com'}>`,
      to,
      subject,
      html
    })
    console.log('邮件发送成功:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('邮件发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 发送新用户创建通知邮件
 * @param {Object} userInfo - 用户信息
 * @param {string} plainPassword - 明文密码
 */
export const sendNewUserEmail = async (userInfo, plainPassword) => {
  const subject = '【PIS系统】您的账户已创建'
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
        <h2>PIS绩效指标管理系统</h2>
        <p>ISO 22163 体系管理平台</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h3>您好，${userInfo.userName}！</h3>
        <p>您的账户已创建成功，请使用以下信息登录系统：</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #409EFF;">
          <p><strong>登录地址：</strong> <a href="${appUrl}" style="color: #409EFF;">${appUrl}</a></p>
          <p><strong>用户名：</strong> ${userInfo.username}</p>
          <p><strong>初始密码：</strong> <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">${plainPassword}</span></p>
          <p><strong>所属部门：</strong> ${userInfo.department || '未分配'}</p>
          <p><strong>角色：</strong> ${userInfo.role === 'admin' ? '管理员' : '普通用户'}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>温馨提示：</strong></p>
          <ul style="color: #856404; margin: 10px 0;">
            <li>请尽快登录系统并修改初始密码</li>
            <li>请妥善保管您的账户信息，不要泄露给他人</li>
            <li>如有问题，请联系系统管理员</li>
          </ul>
        </div>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>此邮件由系统自动发送，请勿回复</p>
        <p>PIS系统 © 2025</p>
      </div>
    </div>
  `
  
  return await sendMail(userInfo.email, subject, html)
}