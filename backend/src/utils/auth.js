import jwt from 'jsonwebtoken'

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' })
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = verifyToken(token)
    req.userId = decoded.userId
    req.username = decoded.username
    req.userName = decoded.username  // 添加 userName（大写N）
    req.userRole = decoded.role
    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' })
  }
}
