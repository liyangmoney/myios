import { query } from '../config/database.js'
import { sendMail } from '../utils/mail.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传目录
const uploadDir = path.join(__dirname, '../../uploads/quality-events')

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
             r.user_name as reporter_name
      FROM quality_event e
      LEFT JOIN sys_user r ON e.reporter_id = r.id
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
      sql += ' AND JSON_CONTAINS(e.responsible_ids, ?)'
      params.push(responsibleId)
    }
    
    if (currentHandlerId) {
      // 筛选当前处理人的事件（包括状态为 CLOSED 的）
      sql += ' AND (e.current_handler_id = ? OR JSON_CONTAINS(e.responsible_ids, ?) OR e.reporter_id = ?)'
      params.push(currentHandlerId, currentHandlerId, currentHandlerId)
    }
    
    sql += ' ORDER BY e.created_at DESC'
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 10)
    const offset = (pageNum - 1) * pageSizeNum
    
    sql += ' LIMIT ? OFFSET ?'
    params.push(pageSizeNum, offset)
    
    const events = await query(sql, params)
    
    // 解析通知人列表和查询责任人姓名、当前处理人名称
    for (const event of events) {
      if (event.notify_users) {
        try {
          event.notify_users = JSON.parse(event.notify_users)
        } catch {
          event.notify_users = []
        }
      } else {
        event.notify_users = []
      }
      
      // 处理当前处理人名称（可能是JSON数组，用于D阶段的多责任人）
      if (event.current_handler_name) {
        try {
          const parsed = JSON.parse(event.current_handler_name)
          if (Array.isArray(parsed)) {
            event.current_handler_name = parsed.join(', ')
          }
        } catch {
          // 不是JSON，保持原样
        }
      } else if (event.current_handler_id) {
        // 如果current_handler_name为空但有current_handler_id，查询数据库
        const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [event.current_handler_id])
        event.current_handler_name = users[0]?.user_name || '-'
      } else {
        event.current_handler_name = '-'
      }
      
      // 查询责任人姓名
      if (event.responsible_ids) {
        try {
          const responsibleIds = JSON.parse(event.responsible_ids)
          if (responsibleIds.length > 0) {
            const placeholders = responsibleIds.map(() => '?').join(',')
            const users = await query(
              `SELECT user_name FROM sys_user WHERE id IN (${placeholders})`,
              responsibleIds
            )
            event.responsible_name = users.map(u => u.user_name).join(', ')
          } else {
            event.responsible_name = '-'
          }
        } catch {
          event.responsible_name = '-'
        }
      } else {
        event.responsible_name = '-'
      }
    }
    
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
    if (responsibleId) {
      countSql += ' AND JSON_CONTAINS(responsible_ids, ?)'
      countParams.push(responsibleId)
    }
    if (currentHandlerId) {
      countSql += ' AND (current_handler_id = ? OR JSON_CONTAINS(responsible_ids, ?) OR reporter_id = ?)'
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
    
    // 调试日志：检查current_handler_name
    console.log(`[DEBUG] 事件详情: id=${id}, current_handler_name=${event.current_handler_name}, current_handler_id=${event.current_handler_id}`)
    
    // 处理当前处理人名称（可能是JSON数组，用于D阶段的多责任人）
    if (event.current_handler_name) {
      try {
        // 尝试解析为JSON数组
        const parsed = JSON.parse(event.current_handler_name)
        if (Array.isArray(parsed)) {
          event.current_handler_name = parsed.join(', ')
        }
      } catch {
        // 不是JSON，保持原样（单个处理人的情况）
      }
    }
    
    // 解析责任人IDs并查询姓名
    let responsibleIds = []
    if (event.responsible_ids) {
      try {
        responsibleIds = JSON.parse(event.responsible_ids)
      } catch {
        responsibleIds = []
      }
    }
    
    // 查询所有责任人姓名
    let responsibleNames = []
    if (responsibleIds.length > 0) {
      const placeholders = responsibleIds.map(() => '?').join(',')
      const users = await query(
        `SELECT id, user_name FROM sys_user WHERE id IN (${placeholders})`,
        responsibleIds
      )
      responsibleNames = users.map(u => u.user_name)
      event.responsible_ids_list = users  // 返回完整的责任人信息
    }
    event.responsible_name = responsibleNames.join(', ')  // 用逗号连接所有姓名
    
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
      productStage,
      productType,
      projectNo,
      customer,
      keywords,
      problemType,
      severity,
      relatedParts,
      discoveryForm,
      responsibleIds,
      supervisorId,
      dueDate,
      notifyUsers,
      descriptionFiles,
      isChanged,
      changeSourceId,
      changeSourceNo
    } = req.body
    
    if (!title || !description) {
      return res.status(400).json({ code: 400, message: '标题和描述不能为空' })
    }
    
    if (!responsibleIds || responsibleIds.length === 0) {
      return res.status(400).json({ code: 400, message: '责任人不能为空' })
    }
    
    if (!dueDate) {
      return res.status(400).json({ code: 400, message: '截止日期不能为空' })
    }
    
    const eventNo = await generateEventNo()
    const reporterId = req.userId
    const reporterName = req.userName
    
    // 获取责任人姓名列表
    let responsibleName = null
    let responsibleId = null
    
    // 解析责任人IDs
    let parsedResponsibleIds = []
    if (typeof responsibleIds === 'string') {
      parsedResponsibleIds = responsibleIds.split(',').filter(Boolean).map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    } else if (Array.isArray(responsibleIds)) {
      parsedResponsibleIds = responsibleIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id))
    }
    
    // 查询所有责任人姓名
    let responsibleNamesList = []
    if (parsedResponsibleIds.length > 0) {
      responsibleId = parsedResponsibleIds[0] // 取第一个作为主责任人（兼容旧字段）
      const placeholders = parsedResponsibleIds.map(() => '?').join(',')
      const users = await query(`SELECT user_name FROM sys_user WHERE id IN (${placeholders})`, parsedResponsibleIds)
      responsibleNamesList = users.map(u => u.user_name)
      responsibleName = responsibleNamesList.join(', ') // 所有责任人姓名，用逗号分隔
    }
    
    // 获取监督人姓名
    let supervisorName = null
    if (supervisorId) {
      const users = await query('SELECT user_name FROM sys_user WHERE id = ?', [supervisorId])
      if (users.length > 0) {
        supervisorName = users[0].user_name
      }
    }
    
    // 调试日志
    console.log(`[DEBUG] 创建事件: reporterId=${reporterId}, reporterName=${reporterName}, current_handler_id=${reporterId}, current_handler_name=${reporterName}`)
    
    const result = await query(`
      INSERT INTO quality_event 
      (event_no, title, description, 
       product_stage, product_type, project_no, customer, keywords, problem_type,
       severity, related_parts, discovery_form,
       reporter_id, reporter_name,
       responsible_ids, responsible_name, supervisor_id, supervisor_name,
       current_handler_id, current_handler_name, due_date, notify_users, status,
       description_files, is_changed, change_source_id, change_source_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?)
    `, [
      eventNo, title, description,
      productStage, productType, projectNo, customer, keywords, problemType,
      severity, 
      // 将逗号分隔字符串转为JSON数组
      relatedParts ? JSON.stringify(relatedParts.split(',').filter(Boolean)) : '[]',
      discoveryForm ? JSON.stringify(discoveryForm.split(',').filter(Boolean)) : '[]',
      reporterId, reporterName,
      // 责任人可能是逗号分隔字符串或数组
      JSON.stringify(parsedResponsibleIds), responsibleName, supervisorId, supervisorName,
      // 当前处理人设为创建人（P阶段由创建人编写）
      reporterId, reporterName, dueDate, JSON.stringify(notifyUsers || []),
      JSON.stringify(descriptionFiles || []), isChanged || 0, changeSourceId || null, changeSourceNo || null
    ])
    
    const eventId = result.insertId
    
    // 如果有临时文件，移动到正式文件夹
    if (descriptionFiles && descriptionFiles.length > 0) {
      const tempDir = path.join(uploadDir, 'temp')
      const eventDir = path.join(uploadDir, eventNo)
      
      // 创建正式文件夹
      if (!fs.existsSync(eventDir)) {
        fs.mkdirSync(eventDir, { recursive: true })
      }
      
      const movedFiles = []
      for (const file of descriptionFiles) {
        if (file.url && file.url.includes('/temp/')) {
          // 从URL中提取临时文件路径
          const tempFileName = file.url.split('/').pop()
          const tempFilePath = path.join(tempDir, tempFileName)
          
          if (fs.existsSync(tempFilePath)) {
            // 生成新文件名
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            const safeName = file.name.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
            const newFileName = `${uniqueSuffix}_${safeName}`
            const newFilePath = path.join(eventDir, newFileName)
            
            // 移动文件
            fs.renameSync(tempFilePath, newFilePath)
            
            // 更新文件URL
            movedFiles.push({
              ...file,
              url: `/uploads/quality-events/${eventNo}/${newFileName}`
            })
          } else {
            // 文件不存在，保留原URL
            movedFiles.push(file)
          }
        } else {
          // 不是临时文件，保留原样
          movedFiles.push(file)
        }
      }
      
      // 更新数据库中的文件路径
      await query(
        'UPDATE quality_event SET description_files = ? WHERE id = ?',
        [JSON.stringify(movedFiles), eventId]
      )
    }
    
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
    
    // 新逻辑：通知所有责任人 + 监督/确认人 + 通知人列表
    const allNotifyIds = [...new Set([
      ...parsedResponsibleIds,
      ...(supervisorId ? [supervisorId] : []),
      ...(notifyUsers || [])
    ])]
    
    // 发送通知邮件
    await sendNotificationEmail(event, allNotifyIds, '新建质量事件')
    
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
    if (updateData.causeType !== undefined) {
      fields.push('cause_type = ?')
      values.push(JSON.stringify(updateData.causeType))
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
    
    // 解析责任人IDs
    let responsibleIds = []
    if (event.responsible_ids) {
      try {
        responsibleIds = JSON.parse(event.responsible_ids)
      } catch {}
    }
    
    // 查询责任人姓名
    let responsibleNames = []
    if (responsibleIds.length > 0) {
      const placeholders = responsibleIds.map(() => '?').join(',')
      const users = await query(
        `SELECT user_name FROM sys_user WHERE id IN (${placeholders})`,
        responsibleIds
      )
      responsibleNames = users.map(u => u.user_name)
    }
    
    // 解析通知人列表
    let notifyUserIds = []
    if (event.notify_users) {
      try {
        notifyUserIds = JSON.parse(event.notify_users)
      } catch {}
    }
    
    // 新PDCA通知逻辑
    if (updateData.status) {
      const oldStatus = oldEvent.status
      const newStatus = updateData.status
      
      // P -> D: 通知所有责任人，当前处理人设为所有责任人（用JSON数组存储）
      if (newStatus === 'DO' && (oldStatus === 'NEW' || oldStatus === 'PLAN')) {
        console.log(`P->D转换: 事件ID=${id}, responsibleIds=${JSON.stringify(responsibleIds)}, responsibleNames=${JSON.stringify(responsibleNames)}`)
        // 更新当前处理人为所有责任人（存储为JSON数组）
        if (responsibleIds.length > 0) {
          const result = await query('UPDATE quality_event SET current_handler_id = NULL, current_handler_name = ? WHERE id = ?', 
            [JSON.stringify(responsibleNames), id])
          console.log(`P->D转换: 更新结果=${JSON.stringify(result)}`)
        } else {
          console.log(`P->D转换: responsibleIds为空，不更新current_handler_name`)
        }
        await sendNotificationEmail(event, responsibleIds, '质量事件进入D阶段，需要您处理')
      }
      
      // D -> C: 通知C阶段指定人
      else if (newStatus === 'CHECK' && oldStatus === 'DO') {
        // C阶段处理人在前端指定，这里使用currentHandlerId
        if (updateData.currentHandlerId) {
          await sendNotificationEmail(event, [updateData.currentHandlerId], '质量事件进入C阶段，需要您验证')
        }
      }
      
      // C -> A (通过): 通知监督/确认人
      else if (newStatus === 'ACT' && oldStatus === 'CHECK') {
        if (event.supervisor_id) {
          await query('UPDATE quality_event SET current_handler_id = ?, current_handler_name = ? WHERE id = ?', 
            [event.supervisor_id, event.supervisor_name, id])
          await sendNotificationEmail(event, [event.supervisor_id], '质量事件进入A阶段，需要您确认关闭')
        }
      }
      
      // C -> D (不通过): 通知所有责任人，当前处理人恢复为所有责任人
      else if (newStatus === 'DO' && oldStatus === 'CHECK') {
        if (responsibleIds.length > 0) {
          await query('UPDATE quality_event SET current_handler_id = NULL, current_handler_name = ? WHERE id = ?', 
            [JSON.stringify(responsibleNames), id])
        }
        await sendNotificationEmail(event, responsibleIds, '质量事件验证不通过，返回D阶段，需要您重新处理')
      }
      
      // A -> CLOSED: 通知创建人和通知人
      else if (newStatus === 'CLOSED') {
        const allNotifyIds = [...new Set([event.reporter_id, ...notifyUserIds])]
        await sendNotificationEmail(event, allNotifyIds, '质量事件已关闭')
      }
    }
    
    // 构建详细的操作日志内容
    const logNewValue = { ...updateData }
    
    // A阶段（进入CLOSED状态）添加详细信息
    if (updateData.status === 'CLOSED' && oldEvent.status === 'ACT') {
      logNewValue.actionDetail = 'A阶段确认关闭'
      if (updateData.causeType) {
        logNewValue.causeTypeDetail = `原因类型: ${Array.isArray(updateData.causeType) ? updateData.causeType.join(', ') : updateData.causeType}`
      }
      if (updateData.standardization) {
        logNewValue.standardizationDetail = `标准化措施: ${updateData.standardization}`
      }
    }
    
    // 记录操作日志
    await query(`
      INSERT INTO quality_event_log (event_id, user_id, user_name, action, old_value, new_value)
      VALUES (?, ?, ?, 'UPDATE', ?, ?)
    `, [id, userId, userName, JSON.stringify(oldEvent), JSON.stringify(logNewValue)])
    
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
    
    // 删除相关文件和文件夹
    const eventNo = event.event_no
    const eventDir = path.join(uploadDir, eventNo)
    
    // 如果文件夹存在，递归删除
    if (fs.existsSync(eventDir)) {
      try {
        fs.rmSync(eventDir, { recursive: true, force: true })
        console.log(`已删除事件文件夹: ${eventDir}`)
      } catch (err) {
        console.error('删除事件文件夹失败:', err)
      }
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
    
    // 准备文件信息
    let newFiles = []
    let eventNo = 'temp'
    
    // 如果是临时上传（创建事件前），不查询数据库
    if (id === 'temp') {
      newFiles = req.files.map(file => {
        let originalName = file.originalname
        if (!req.body.isBase64) {
          try {
            originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
          } catch (e) {}
        }
        return {
          name: originalName,
          url: `/uploads/quality-events/temp/${file.filename}`,
          type: file.mimetype,
          size: file.size,
          uploadTime: new Date().toISOString()
        }
      })
    } else {
      // 正常上传，查询事件
      const events = await query('SELECT * FROM quality_event WHERE id = ?', [id])
      if (events.length === 0) {
        return res.status(404).json({ code: 404, message: '事件不存在' })
      }
      
      const event = events[0]
      eventNo = event.event_no
      
      // 准备文件信息
      newFiles = req.files.map(file => {
        let originalName = file.originalname
        if (!req.body.isBase64) {
          try {
            originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
          } catch (e) {}
        }
        return {
          name: originalName,
          url: `/uploads/quality-events/${eventNo}/${file.filename}`,
          type: file.mimetype,
          size: file.size,
          uploadTime: new Date().toISOString()
        }
      })
    
    // 根据阶段更新对应的文件字段
    let fieldName
    let existingFiles = []
    
    // 如果是评论附件、PDCA阶段附件 或 创建事件时的描述附件，直接返回文件信息
    // 由前端在提交时统一处理
    if (stage === 'comment' || stage === 'plan' || stage === 'do' || stage === 'check' || stage === 'act' || stage === 'description' || id === 'temp') {
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
    }
    
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
      
      // 计算是否应该发送提醒（每6小时一次）
      const lastReminder = event.last_reminder_at ? new Date(event.last_reminder_at) : null
      const now = new Date()
      const shouldSend = !lastReminder || (now - lastReminder) >= (6 * 60 * 60 * 1000)
      
      if (!shouldSend) {
        console.log(`事件 ${event.event_no} 距离上次提醒不足6小时，跳过`)
        continue
      }
      
      // 新逻辑：到期提醒只通知当前处理人
      const notifyUserIds = []
      if (event.current_handler_id) {
        notifyUserIds.push(event.current_handler_id)
      }
      
      if (notifyUserIds.length === 0) {
        console.log(`事件 ${event.event_no} 没有当前处理人，跳过`)
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

// 定时任务：检查已过期的事件，发送邮件给通知人列表
export const checkOverdueEvents = async () => {
  try {
    console.log('[' + new Date().toISOString() + '] 检查已过期质量事件...')
    
    // 查找未关闭且已过期超过7天的事件
    const events = await query(`
      SELECT * FROM quality_event
      WHERE deleted_at IS NULL
        AND status != 'CLOSED'
        AND status != 'REJECTED'
        AND due_date IS NOT NULL
        AND due_date <= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)
    
    console.log(`找到 ${events.length} 个已过期超过7天的事件`)
    
    for (const event of events) {
      // 计算超期天数
      const daysOverdue = Math.floor((new Date() - new Date(event.due_date)) / (1000 * 60 * 60 * 24))
      
      // 计算是否应该发送提醒（每隔一天）
      const lastOverdueReminder = event.last_overdue_reminder_at ? new Date(event.last_overdue_reminder_at) : null
      const now = new Date()
      const shouldSend = !lastOverdueReminder || (now - lastOverdueReminder) >= (1 * 24 * 60 * 60 * 1000)

      if (!shouldSend) {
        console.log(`事件 ${event.event_no} 距离上次过期提醒不足1天，跳过`)
        continue
      }
      
      // 新逻辑：过期提醒通知通知人列表
      let notifyUserIds = []
      if (event.notify_users) {
        try {
          notifyUserIds = JSON.parse(event.notify_users)
        } catch {}
      }
      
      if (notifyUserIds.length === 0) {
        console.log(`事件 ${event.event_no} 没有通知人，跳过`)
        continue
      }
      
      // 发送过期提醒邮件
      await sendNotificationEmail(event, notifyUserIds, `已超期${daysOverdue}天`, true)
      console.log(`已发送过期提醒：${event.event_no}，已超期 ${daysOverdue} 天`)
      
      // 更新最后过期提醒时间
      await query(
        'UPDATE quality_event SET last_overdue_reminder_at = NOW() WHERE id = ?',
        [event.id]
      )
    }
    
    console.log('过期提醒检查完成')
  } catch (error) {
    console.error('检查过期提醒失败:', error)
  }
}

// 发送超期30天提醒邮件
const sendOverdue30DaysEmail = async (event, notifyUserIds, daysOverdue) => {
  try {
    // 获取通知人邮箱
    const users = await query(
      'SELECT email, user_name FROM sys_user WHERE id IN (?) AND deleted_at IS NULL',
      [notifyUserIds]
    )
    
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    
    for (const user of users) {
      if (!user.email) continue
      
      const subject = `【质量事件严重超期提醒】${event.event_no} 已超期${daysOverdue}天未关闭`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 20px; text-align: center; color: white;">
            <h2>⚠️ 质量事件严重超期提醒</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="color: #d63031; font-size: 18px; font-weight: bold;">该事件已超期 ${daysOverdue} 天未关闭！</p>
            <p style="color: #666;">截止日期：${event.due_date ? new Date(event.due_date).toLocaleDateString('zh-CN') : '未设置'}</p>
            
            <p><strong>事件编号：</strong> ${event.event_no}</p>
            <p><strong>事件标题：</strong> ${event.title}</p>
            <p><strong>严重程度：</strong> ${event.severity}</p>
            <p><strong>当前状态：</strong> ${getStatusLabel(event.status)}</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>问题描述：</strong></p>
              <p>${event.description || '暂无'}</p>
            </div>
            
            <p style="color: #d63031; font-weight: bold;">请尽快处理或关闭此事件！</p>
            
            <p><a href="${appUrl}/quality-events/${event.id}" style="color: #409EFF;">点击查看详情</a></p>
          </div>
        </div>
      `
      
      await sendMail(user.email, subject, html)
    }
  } catch (error) {
    console.error('发送超期30天提醒邮件失败:', error)
  }
}
