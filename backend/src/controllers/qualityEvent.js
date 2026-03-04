import { query } from '../config/database.js'
import { sendMail } from '../utils/mail.js'

// 生成事件编号
const generateEventNo = async () => {
  const year = new Date().getFullYear()
  const result = await query(
    "SELECT COUNT(*) as count FROM quality_event WHERE event_no LIKE ?",
    [`QE-${year}-%`]
  )
  const count = result[0].count + 1
  return `QE-${year}-${String(count).padStart(3, '0')}`
}

// 发送通知邮件
const sendNotificationEmail = async (event, notifyUserIds, action, isReminder = false) => {
  if (!notifyUserIds || notifyUserIds.length === 0) return
  
  try {
    // 获取通知人邮箱
    const users = await query(
      'SELECT email, user_name FROM sys_user WHERE id IN (?) AND deleted_at IS NULL',
      [notifyUserIds]
    )
    
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    
    for (const user of users) {
      if (!user.email) continue
      
      let subject, html
      
      if (isReminder) {
        // 提醒邮件
        const hoursLeft = Math.ceil((new Date(event.due_date) - new Date()) / (1000 * 60 * 60))
        subject = `【质量事件提醒】${event.event_no} 即将到期`
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f56c6c; padding: 20px; text-align: center; color: white;">
              <h2>⚠️ 质量事件即将到期</h2>
            </div>
            
            <div style="padding: 30px; background-color: #f9f9f9;">
              <p style="color: #f56c6c; font-size: 18px; font-weight: bold;">
                还有 ${hoursLeft} 小时到期！
              </p>
              <p><strong>事件编号：</strong> ${event.event_no}</p>
              <p><strong>事件标题：</strong> ${event.title}</p>
              <p><strong>当前处理人：</strong> ${event.current_handler_name || '未分配'}</p>
              <p><strong>截止日期：</strong> ${event.due_date}</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>问题描述：</strong></p>
                <p>${event.description || '暂无'}</p>
              </div>
              
              <p><a href="${appUrl}/quality-events/${event.id}" style="color: #409EFF;">点击立即处理</a></p>
            </div>
          </div>
        `
      } else {
        // 普通通知邮件
        subject = `【质量事件】${action} - ${event.event_no}`
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
              <h2>质量事件通知</h2>
            </div>
            
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h3>${action}</h3>
              <p><strong>事件编号：</strong> ${event.event_no}</p>
              <p><strong>事件标题：</strong> ${event.title}</p>
              <p><strong>严重程度：</strong> ${event.severity}</p>
              <p><strong>当前状态：</strong> ${getStatusLabel(event.status)}</p>
              <p><strong>责任人：</strong> ${event.responsible_name || '未分配'}</p>
              ${event.current_handler_name ? `<p><strong>当前处理人：</strong> ${event.current_handler_name}</p>` : ''}
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>问题描述：</strong></p>
                <p>${event.description || '暂无'}</p>
              </div>
              
              <p><a href="${appUrl}/quality-events/${event.id}" style="color: #409EFF;">点击查看详情</a></p>
            </div>
          </div>
        `
      }
      
      await sendMail(user.email, subject, html)
    }
  } catch (error) {
    console.error('发送通知邮件失败:', error)
  }
}

const getStatusLabel = (status) => {
  const labels = {
    NEW: '新建',
    PLAN: '计划中',
    DO: '执行中',
    CHECK: '验证中',
    CLOSED: '已关闭',
    REJECTED: '已驳回'
  }
  return labels[status] || status
}

// 获取质量事件列表
export const getQualityEvents = async (req, res) => {
  try {
    const {
      keyword,
      status,
      severity,
      eventType,
      reporterId,
      responsibleId,
      currentHandlerId,
      page = 1,
      pageSize = 10
    } = req.query
    
    let sql = `
      SELECT e.*, 
             r.user_name as reporter_name,
             u.user_name as responsible_name,
             c.user_name as current_handler_name
      FROM quality_event e
      LEFT JOIN sys_user r ON e.reporter_id = r.id
      LEFT JOIN sys_user u ON e.responsible_id = u.id
      LEFT JOIN sys_user c ON e.current_handler_id = c.id
      WHERE e.deleted_at IS NULL
    `
    const params = []
    
    if (keyword) {
      sql += ' AND (e.event_no LIKE ? OR e.title LIKE ? OR e.description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    if (status) {
      sql += ' AND e.status = ?'
      params.push(status)
    }
    
    if (severity) {
      sql += ' AND e.severity = ?'
      params.push(severity)
    }
    
    if (eventType) {
      sql += ' AND e.event_type = ?'
      params.push(eventType)
    }
    
    if (reporterId) {
      sql += ' AND e.reporter_id = ?'
      params.push(reporterId)
    }
    
    if (responsibleId) {
      sql += ' AND e.responsible_id = ?'
      params.push(responsibleId)
    }
    
    if (currentHandlerId) {
      // 筛选当前处理人的事件（包括状态为 CLOSED 的）
      sql += ' AND (e.current_handler_id = ? OR e.responsible_id = ? OR e.reporter_id = ?)'
      params.push(currentHandlerId, currentHandlerId, currentHandlerId)
    }
    
    sql += ' ORDER BY e.created_at DESC'
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 10)
    const offset = (pageNum - 1) * pageSizeNum
    
    sql += ' LIMIT ? OFFSET ?'
    params.push(pageSizeNum, offset)
    
    const events = await query(sql, params)
    
    // 解析通知人列表
    events.forEach(event => {
      if (event.notify_users) {
        try {
          event.notify_users = JSON.parse(event.notify_users)
        } catch {
          event.notify_users = []
        }
      } else {
        event.notify_users = []
      }
    })
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM quality_event WHERE deleted_at IS NULL'
    const countParams = []
    
    if (keyword) {
      countSql += ' AND (event_no LIKE ? OR title LIKE ? OR description LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    if (severity) {
      countSql += ' AND severity = ?'
      countParams.push(severity)
    }
    if (eventType) {
      countSql += ' AND event_type = ?'
      countParams.push(eventType)
    }
    if (currentHandlerId) {
      countSql += ' AND (current_handler_id = ? OR responsible_id = ? OR reporter_id = ?)'
      countParams.push(currentHandlerId, currentHandlerId, currentHandlerId)
    }
    
    const countResult = await query(countSql, countParams)
    
    res.json({
      code: 200,
      data: {
        list: events,
        total: countResult[0].total,
        page: pageNum,
        pageSize: pageSizeNum
      }
    })
  } catch (error) {
    console.error('获取质量事件列表失败:', error)
    res.status(500).json({ code: 500, message: '获取质量事件列表失败：' + error.message })
  }
}

// 获取质量事件详情
export const getQualityEventDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const events = await query(`
      SELECT e.*,
             r.user_name as reporter_name,
             u.user_name as responsible_name,
             v.user_name as verified_by_name,
             c.user_name as closed_by_name,
             pf.user_name as plan_filled_by_name,
             df.user_name as do_filled_by_name
      FROM quality_event e
      LEFT JOIN sys_user r ON e.reporter_id = r.id
      LEFT JOIN sys_user u ON e.responsible_id = u.id
      LEFT JOIN sys_user v ON e.verified_by = v.id
      LEFT JOIN sys_user c ON e.closed_by = c.id
      LEFT JOIN sys_user pf ON e.plan_filled_by = pf.id
      LEFT JOIN sys_user df ON e.do_filled_by = df.id
      WHERE e.id = ? AND e.deleted_at IS NULL
    `, [id])
    
    if (events.length === 0) {
      return res.status(404).json({ code: 404, message: '质量事件不存在' })
    }
    
    const event = events[0]
    
    // 解析通知人列表
    let notifyUserIds = []
    if (event.notify_users) {
      try {
        notifyUserIds = JSON.parse(event.notify_users)
      } catch {
        notifyUserIds = []
      }
    }
    event.notify_users = notifyUserIds
    
    // 查询通知人姓名
    if (notifyUserIds.length > 0) {
      const notifyUsers = await query(
        'SELECT id, user_name FROM sys_user WHERE id IN (?)',
        [notifyUserIds]
      )
      event.notify_user_names = notifyUsers.map(u => u.user_name)
    } else {
      event.notify_user_names = []
    }
    
    // 获取评论记录
    const comments = await query(`
      SELECT c.*, u.user_name
      FROM quality_event_comment c
      LEFT JOIN sys_user u ON c.user_id = u.id
      WHERE c.event_id = ?
      ORDER BY c.created_at ASC
    `, [id])
    
    // 获取操作日志
    const logs = await query(`
      SELECT l.*, u.user_name
      FROM quality_event_log l
      LEFT JOIN sys_user u ON l.user_id = u.id
      WHERE l.event_id = ?
      ORDER BY l.created_at DESC
    `, [id])
    
    res.json({
      code: 200,
      data: {
        ...event,
        comments,
        logs
      }
    })
  } catch (error) {
    console.error('获取质量事件详情失败:', error)
    res.status(500).json({ code: 500, message: '获取质量事件详情失败' })
  }
}

// 创建质量事件
export const createQualityEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      severity,
      responsibleId,
      department,
      dueDate,
      notifyUsers
    } = req.body
    
    if (!title || !description) {
      return res.status(400).json({ code: 400, message: '标题和描述不能为空' })
    }
    
    if (!responsibleId) {
      return res.status(400).json({ code: 400, message: '责任人不能为空' })
    }
    
    if (!dueDate) {
      return res.status(400).json({ code: 400, message: '截止日期不能为空' })
    }
    
    const eventNo = await generateEventNo()
    const reporterId = req.userId
    const reporterName = req.userName
    
    // 获取责任人姓名
    let responsibleName = null
    if (responsibleId) {
      const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [responsibleId])
      if (users.length > 0) {
        responsibleName = users[0].user_name
      }
    }
    
    const result = await query(`
      INSERT INTO quality_event 
      (event_no, title, description, event_type, severity, reporter_id, reporter_name,
       responsible_id, responsible_name, current_handler_id, current_handler_name, department, due_date, notify_users, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
    `, [
      eventNo, title, description, eventType, severity,
      reporterId, reporterName, responsibleId, responsibleName, responsibleId, responsibleName,
      department, dueDate, JSON.stringify(notifyUsers || [])
    ])
    
    const eventId = result.insertId
    
    // 获取完整事件信息用于通知
    const event = {
      id: eventId,
      event_no: eventNo,
      title,
      description,
      severity,
      status: 'NEW',
      responsible_name: responsibleName
    }
    
    // 发送通知邮件
    await sendNotificationEmail(event, notifyUsers, '新建质量事件')
    
    // 记录操作日志
    await query(`
      INSERT INTO quality_event_log (event_id, user_id, user_name, action, new_value)
      VALUES (?, ?, ?, 'CREATE', ?)
    `, [eventId, reporterId, reporterName, JSON.stringify({ title, eventNo })])
    
    res.json({
      code: 200,
      message: '质量事件创建成功',
      data: { id: eventId, eventNo }
    })
  } catch (error) {
    console.error('创建质量事件失败:', error)
    res.status(500).json({ code: 500, message: '创建质量事件失败：' + error.message })
  }
}

// 更新质量事件
export const updateQualityEvent = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    const userId = req.userId
    const userName = req.userName
    
    // 检查事件是否存在
    const events = await query('SELECT * FROM quality_event WHERE id = ? AND deleted_at IS NULL', [id])
    if (events.length === 0) {
      return res.status(404).json({ code: 404, message: '质量事件不存在' })
    }
    
    const oldEvent = events[0]
    
    // 构建更新 SQL
    const fields = []
    const values = []
    
    if (updateData.title !== undefined) {
      fields.push('title = ?')
      values.push(updateData.title)
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?')
      values.push(updateData.description)
    }
    if (updateData.rootCause !== undefined) {
      fields.push('root_cause = ?')
      values.push(updateData.rootCause)
    }
    if (updateData.correctiveAction !== undefined) {
      fields.push('corrective_action = ?')
      values.push(updateData.correctiveAction)
    }
    if (updateData.implementation !== undefined) {
      fields.push('implementation = ?')
      values.push(updateData.implementation)
    }
    if (updateData.verificationResult !== undefined) {
      fields.push('verification_result = ?')
      values.push(updateData.verificationResult)
    }
    if (updateData.standardization !== undefined) {
      fields.push('standardization = ?')
      values.push(updateData.standardization)
    }
    if (updateData.responsibleId !== undefined) {
      fields.push('responsible_id = ?')
      values.push(updateData.responsibleId)
      // 更新责任人姓名
      if (updateData.responsibleId) {
        const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [updateData.responsibleId])
        if (users.length > 0) {
          fields.push('responsible_name = ?')
          values.push(users[0].user_name)
        }
      }
    }
    if (updateData.nextHandlerId !== undefined) {
      fields.push('next_handler_id = ?')
      values.push(updateData.nextHandlerId)
      // 更新下一步处理人姓名
      if (updateData.nextHandlerId) {
        const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [updateData.nextHandlerId])
        if (users.length > 0) {
          fields.push('next_handler_name = ?')
          values.push(users[0].user_name)
        }
      } else {
        fields.push('next_handler_name = NULL')
      }
    }
    if (updateData.currentHandlerId !== undefined) {
      fields.push('current_handler_id = ?')
      values.push(updateData.currentHandlerId)
      if (updateData.currentHandlerId) {
        const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [updateData.currentHandlerId])
        if (users.length > 0) {
          fields.push('current_handler_name = ?')
          values.push(users[0].user_name)
        }
      } else {
        fields.push('current_handler_name = NULL')
      }
    }
    if (updateData.nextStep !== undefined) {
      fields.push('next_step = ?')
      values.push(updateData.nextStep)
    }
    if (updateData.department !== undefined) {
      fields.push('department = ?')
      values.push(updateData.department)
    }
    if (updateData.dueDate !== undefined) {
      fields.push('due_date = ?')
      values.push(updateData.dueDate)
    }
    if (updateData.notifyUsers !== undefined) {
      fields.push('notify_users = ?')
      values.push(JSON.stringify(updateData.notifyUsers))
    }
    // 处理各阶段附件
    if (updateData.planFiles !== undefined) {
      fields.push('plan_files = ?')
      values.push(JSON.stringify(updateData.planFiles))
    }
    if (updateData.doFiles !== undefined) {
      fields.push('implementation_files = ?')
      values.push(JSON.stringify(updateData.doFiles))
    }
    if (updateData.checkFiles !== undefined) {
      fields.push('check_files = ?')
      values.push(JSON.stringify(updateData.checkFiles))
    }
    if (updateData.actFiles !== undefined) {
      fields.push('act_files = ?')
      values.push(JSON.stringify(updateData.actFiles))
    }
    if (updateData.status !== undefined) {
      fields.push('status = ?')
      values.push(updateData.status)
      
      // 状态变更时更新相关时间和填写人
      if (updateData.status === 'DO' && (oldEvent.status === 'NEW' || oldEvent.status === 'PLAN')) {
        // 从Plan阶段进入Do阶段，记录Plan填写人
        fields.push('plan_filled_by = ?, plan_filled_at = NOW()')
        values.push(userId)
      }
      if (updateData.status === 'CHECK' && oldEvent.status === 'DO') {
        // 从Do阶段进入Check阶段，记录Do填写人
        fields.push('do_filled_by = ?, do_filled_at = NOW()')
        values.push(userId)
      }
      if (updateData.status === 'DO' && oldEvent.status === 'CHECK') {
        // 从Check退回Do阶段，验证不通过
        // 不更新 do_filled_by，保留原来的 Do 填写人
        // 记录验证人（当前 Check 阶段的处理人）
        fields.push('verified_by = ?, verified_at = NOW()')
        values.push(userId)
      }
      if (updateData.status === 'ACT' && oldEvent.status === 'CHECK') {
        // 从Check阶段进入Act阶段，验证通过
        // 记录验证人（当前 Check 阶段的处理人）
        fields.push('verified_by = ?, verified_at = NOW()')
        values.push(userId)
      }
      if (updateData.status === 'CLOSED') {
        fields.push('closed_by = ?, closed_at = NOW()')
        values.push(userId)
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' })
    }
    
    values.push(id)
    
    await query(`UPDATE quality_event SET ${fields.join(', ')} WHERE id = ?`, values)
    
    // 获取更新后的事件信息
    const [event] = await query('SELECT * FROM quality_event WHERE id = ?', [id])
    
    // 如果有新的处理人，查询姓名并添加到 updateData 中用于日志记录
    if (updateData.currentHandlerId) {
      const handlerUsers = await query('SELECT user_name FROM sys_user WHERE id = ?', [updateData.currentHandlerId])
      if (handlerUsers.length > 0) {
        updateData.currentHandlerName = handlerUsers[0].user_name
      }
    }
    
    // 发送通知 - 根据新的业务规则
    if (updateData.status === 'CLOSED') {
      // 1. 事件关闭时，通知通知人
      let notifyUserIds = []
      if (event.notify_users) {
        try {
          notifyUserIds = JSON.parse(event.notify_users)
        } catch {}
      }
      await sendNotificationEmail(event, notifyUserIds, '质量事件已关闭')
    } else if (updateData.status && updateData.currentHandlerId) {
      // 2. 状态变换时，只通知变更后的当前处理人
      await sendNotificationEmail(event, [updateData.currentHandlerId], `状态变更为${getStatusLabel(updateData.status)}`)
    }
    
    // 记录操作日志
    await query(`
      INSERT INTO quality_event_log (event_id, user_id, user_name, action, old_value, new_value)
      VALUES (?, ?, ?, 'UPDATE', ?, ?)
    `, [id, userId, userName, JSON.stringify(oldEvent), JSON.stringify(updateData)])
    
    res.json({ code: 200, message: '质量事件更新成功' })
  } catch (error) {
    console.error('更新质量事件失败:', error)
    res.status(500).json({ code: 500, message: '更新质量事件失败：' + error.message })
  }
}

// 删除质量事件（软删除，仅创建人可删除）
export const deleteQualityEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId
    const userName = req.userName
    
    // 检查事件是否存在
    const events = await query('SELECT * FROM quality_event WHERE id = ? AND deleted_at IS NULL', [id])
    if (events.length === 0) {
      return res.status(404).json({ code: 404, message: '质量事件不存在' })
    }
    
    const event = events[0]
    
    // 仅创建人可删除
    if (event.reporter_id !== userId) {
      return res.status(403).json({ code: 403, message: '只有创建人可以删除该事件' })
    }
    
    await query('UPDATE quality_event SET deleted_at = NOW() WHERE id = ?', [id])
    
    // 记录操作日志
    await query(`
      INSERT INTO quality_event_log (event_id, user_id, user_name, action, old_value)
      VALUES (?, ?, ?, 'DELETE', ?)
    `, [id, userId, userName, JSON.stringify({ title: event.title, eventNo: event.event_no })])
    
    res.json({ code: 200, message: '质量事件删除成功' })
  } catch (error) {
    console.error('删除质量事件失败:', error)
    res.status(500).json({ code: 500, message: '删除质量事件失败' })
  }
}

// 添加评论
export const addComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content, attachments } = req.body
    const userId = req.userId
    const userName = req.userName
    
    if (!content) {
      return res.status(400).json({ code: 400, message: '评论内容不能为空' })
    }
    
    const result = await query(`
      INSERT INTO quality_event_comment (event_id, user_id, user_name, content, attachments)
      VALUES (?, ?, ?, ?, ?)
    `, [id, userId, userName, content, JSON.stringify(attachments || [])])
    
    // 记录操作日志
    const logData = {
      content: content.substring(0, 100),
      attachments: attachments || []
    }
    await query(`
      INSERT INTO quality_event_log (event_id, user_id, user_name, action, new_value)
      VALUES (?, ?, ?, 'COMMENT', ?)
    `, [id, userId, userName, JSON.stringify(logData)])
    
    res.json({
      code: 200,
      message: '评论添加成功',
      data: { id: result.insertId }
    })
  } catch (error) {
    console.error('添加评论失败:', error)
    res.status(500).json({ code: 500, message: '添加评论失败' })
  }
}

// 获取统计信息
export const getStatistics = async (req, res) => {
  try {
    // 按状态统计
    const statusStats = await query(`
      SELECT status, COUNT(*) as count
      FROM quality_event
      WHERE deleted_at IS NULL
      GROUP BY status
    `)
    
    // 按严重程度统计
    const severityStats = await query(`
      SELECT severity, COUNT(*) as count
      FROM quality_event
      WHERE deleted_at IS NULL
      GROUP BY severity
    `)
    
    // 按月统计（近6个月）
    const monthlyStats = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM quality_event
      WHERE deleted_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month
    `)
    
    res.json({
      code: 200,
      data: {
        byStatus: statusStats,
        bySeverity: severityStats,
        byMonth: monthlyStats
      }
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
    res.status(500).json({ code: 500, message: '获取统计信息失败' })
  }
}

// 文件上传
export const uploadFiles = async (req, res) => {
  try {
    const { id } = req.params
    const { stage } = req.query // 从查询参数获取 stage
    const userId = req.userId
    const userName = req.userName
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ code: 400, message: '没有上传文件' })
    }
    
    // 获取当前文件列表
    const events = await query('SELECT * FROM quality_event WHERE id = ?', [id])
    if (events.length === 0) {
      return res.status(404).json({ code: 404, message: '事件不存在' })
    }
    
    const event = events[0]
    
    // 准备文件信息
    const newFiles = req.files.map(file => {
      // 正确处理中文文件名
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      return {
        name: originalName,
        url: `/uploads/quality-events/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        uploadTime: new Date().toISOString()
      }
    })
    
    // 根据阶段更新对应的文件字段
    let fieldName
    let existingFiles = []
    
    // 如果是评论附件或PDCA阶段附件，直接返回文件信息，不更新事件表
    // 由前端在提交时统一处理
    if (stage === 'comment' || stage === 'plan' || stage === 'do' || stage === 'check' || stage === 'act') {
      res.json({
        code: 200,
        message: '文件上传成功',
        data: newFiles
      })
      return
    }
    
    switch (stage) {
      case 'plan':
        fieldName = 'plan_files'
        if (event.plan_files) {
          try {
            existingFiles = JSON.parse(event.plan_files)
          } catch {}
        }
        break
      case 'do':
        fieldName = 'implementation_files'
        if (event.implementation_files) {
          try {
            existingFiles = JSON.parse(event.implementation_files)
          } catch {}
        }
        break
      case 'check':
        fieldName = 'check_files'
        if (event.check_files) {
          try {
            existingFiles = JSON.parse(event.check_files)
          } catch {}
        }
        break
      case 'act':
        fieldName = 'act_files'
        if (event.act_files) {
          try {
            existingFiles = JSON.parse(event.act_files)
          } catch {}
        }
        break
      default:
        return res.status(400).json({ code: 400, message: '无效的阶段' })
    }
    
    // 合并文件列表
    const allFiles = [...existingFiles, ...newFiles]
    
    // 更新数据库
    try {
      await query(`UPDATE quality_event SET ${fieldName} = ? WHERE id = ?`, [
        JSON.stringify(allFiles),
        id
      ])
    } catch (dbError) {
      console.error('数据库更新失败:', dbError)
      return res.status(500).json({ 
        code: 500, 
        message: '数据库更新失败：' + dbError.message 
      })
    }
    
    // 记录操作日志
    const stageLabels = { plan: 'Plan', do: 'Do', check: 'Check', act: 'Act' }
    await query(`
      INSERT INTO quality_event_log (event_id, user_id, user_name, action, new_value)
      VALUES (?, ?, ?, 'UPDATE', ?)
    `, [id, userId, userName, JSON.stringify({
      [fieldName]: JSON.stringify(allFiles),
      files: newFiles, // 包含完整文件信息（name 和 url）
      message: `上传了 ${newFiles.length} 个 ${stageLabels[stage]} 阶段附件: ${newFiles.map(f => f.name).join(', ')}`
    })])
    
    res.json({
      code: 200,
      message: '文件上传成功',
      data: newFiles
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({ code: 500, message: '文件上传失败：' + error.message })
  }
}

// 定时任务：检查即将到期的质量事件并发送提醒
export const checkDueDateReminders = async () => {
  try {
    console.log('[' + new Date().toISOString() + '] 检查质量事件到期提醒...')
    
    // 查找未关闭且即将在72小时内到期的事件
    const events = await query(`
      SELECT * FROM quality_event
      WHERE deleted_at IS NULL
        AND status != 'CLOSED'
        AND status != 'REJECTED'
        AND due_date IS NOT NULL
        AND due_date >= CURDATE()
        AND due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    `)
    
    console.log(`找到 ${events.length} 个即将到期的事件`)
    
    for (const event of events) {
      const hoursLeft = Math.ceil((new Date(event.due_date) - new Date()) / (1000 * 60 * 60))
      
      // 只处理72小时内的
      if (hoursLeft > 72 || hoursLeft < 0) continue
      
      // 计算是否应该发送提醒（每3小时一次）
      const lastReminder = event.last_reminder_at ? new Date(event.last_reminder_at) : null
      const now = new Date()
      const shouldSend = !lastReminder || (now - lastReminder) >= (3 * 60 * 60 * 1000)
      
      if (!shouldSend) {
        console.log(`事件 ${event.event_no} 距离上次提醒不足3小时，跳过`)
        continue
      }
      
      // 准备通知列表
      let notifyUserIds = []
      if (event.notify_users) {
        try {
          notifyUserIds = JSON.parse(event.notify_users)
        } catch {}
      }
      
      // 添加当前处理人
      if (event.current_handler_id && !notifyUserIds.includes(event.current_handler_id)) {
        notifyUserIds.push(event.current_handler_id)
      }
      
      // 添加责任人
      if (event.responsible_id && !notifyUserIds.includes(event.responsible_id)) {
        notifyUserIds.push(event.responsible_id)
      }
      
      if (notifyUserIds.length === 0) {
        console.log(`事件 ${event.event_no} 没有通知人，跳过`)
        continue
      }
      
      // 发送提醒邮件
      await sendNotificationEmail(event, notifyUserIds, '到期提醒', true)
      console.log(`已发送提醒：${event.event_no}，还剩 ${hoursLeft} 小时`)
      
      // 更新最后提醒时间
      await query(
        'UPDATE quality_event SET last_reminder_at = NOW() WHERE id = ?',
        [event.id]
      )
    }
    
    console.log('到期提醒检查完成')
  } catch (error) {
    console.error('检查到期提醒失败:', error)
  }
}
