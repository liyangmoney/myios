import { query } from '../config/database.js'

/**
 * 记录操作日志中间件
 */
export const operationLogMiddleware = (module, action, description) => {
  return async (req, res, next) => {
    const startTime = Date.now()
    
    // 保存原始 send 方法
    const originalSend = res.send
    
    // 重写 send 方法以捕获响应
    res.send = function(data) {
      res.responseData = data
      originalSend.call(this, data)
    }
    
    // 等待请求处理完成
    res.on('finish', async () => {
      try {
        const userId = req.userId || null
        const username = req.user?.username || req.userName || '匿名'
        const userName = req.user?.user_name || req.userName || '匿名'
        
        const ipAddress = req.ip || req.connection.remoteAddress
        const userAgent = req.headers['user-agent']
        
        // 请求数据（敏感信息脱敏）
        let requestData = null
        if (req.body && Object.keys(req.body).length > 0) {
          const safeBody = { ...req.body }
          // 删除敏感字段
          delete safeBody.password
          delete safeBody.oldPassword
          delete safeBody.newPassword
          requestData = JSON.stringify(safeBody).substring(0, 2000)
        }
        
        // 响应数据
        let responseData = null
        let status = 1
        let errorMsg = null
        
        if (res.responseData) {
          try {
            const response = JSON.parse(res.responseData)
            responseData = JSON.stringify(response).substring(0, 1000)
            status = response.code === 200 ? 1 : 0
            if (response.code !== 200) {
              errorMsg = response.message
            }
          } catch (e) {
            responseData = String(res.responseData).substring(0, 1000)
          }
        }
        
        // 插入日志
        await query(`
          INSERT INTO sys_operation_log 
          (user_id, username, user_name, module, action, description, 
           ip_address, user_agent, request_data, response_data, status, error_msg)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, username, userName, module, action, description,
          ipAddress, userAgent, requestData, responseData, status, errorMsg
        ])
      } catch (error) {
        console.error('记录操作日志失败:', error)
      }
    })
    
    next()
  }
}

/**
 * 获取操作日志列表
 */
export const getOperationLogs = async (req, res) => {
  try {
    const { 
      keyword, 
      module, 
      action, 
      startTime, 
      endTime, 
      page = 1, 
      pageSize = 20 
    } = req.query
    
    let sql = `
      SELECT l.*, u.user_name as operator_name
      FROM sys_operation_log l
      LEFT JOIN sys_user u ON l.user_id = u.id
      WHERE 1=1
    `
    const params = []
    
    if (keyword) {
      sql += ' AND (l.username LIKE ? OR l.description LIKE ? OR l.user_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    if (module) {
      sql += ' AND l.module = ?'
      params.push(module)
    }
    
    if (action) {
      sql += ' AND l.action = ?'
      params.push(action)
    }
    
    if (startTime) {
      sql += ' AND l.created_at >= ?'
      params.push(startTime)
    }
    
    if (endTime) {
      sql += ' AND l.created_at <= ?'
      params.push(endTime)
    }
    
    sql += ' ORDER BY l.created_at DESC'
    
    // 分页
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 20)
    const offset = (pageNum - 1) * pageSizeNum
    
    sql += ' LIMIT ? OFFSET ?'
    params.push(pageSizeNum, offset)
    
    const logs = await query(sql, params)
    
    // 获取总数
    let countSql = `
      SELECT COUNT(*) as total 
      FROM sys_operation_log l
      WHERE 1=1
    `
    const countParams = []
    
    if (keyword) {
      countSql += ' AND (l.username LIKE ? OR l.description LIKE ? OR l.user_name LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (module) {
      countSql += ' AND l.module = ?'
      countParams.push(module)
    }
    if (action) {
      countSql += ' AND l.action = ?'
      countParams.push(action)
    }
    if (startTime) {
      countSql += ' AND l.created_at >= ?'
      countParams.push(startTime)
    }
    if (endTime) {
      countSql += ' AND l.created_at <= ?'
      countParams.push(endTime)
    }
    
    const countResult = await query(countSql, countParams)
    
    res.json({
      code: 200,
      data: {
        list: logs,
        total: countResult[0].total,
        page: pageNum,
        pageSize: pageSizeNum
      }
    })
  } catch (error) {
    console.error('获取操作日志失败:', error)
    res.status(500).json({ code: 500, message: '获取操作日志失败' })
  }
}

/**
 * 获取模块列表（用于筛选）
 */
export const getModules = async (req, res) => {
  try {
    const modules = await query(`
      SELECT DISTINCT module FROM sys_operation_log ORDER BY module
    `)
    res.json({
      code: 200,
      data: modules.map(m => m.module)
    })
  } catch (error) {
    console.error('获取模块列表失败:', error)
    res.status(500).json({ code: 500, message: '获取模块列表失败' })
  }
}
