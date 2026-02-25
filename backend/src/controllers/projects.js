import { query, transaction } from '../config/database.js'

// 获取项目列表
export const getProjects = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, projectName, projectType } = req.query
    const offset = (page - 1) * pageSize
    
    let sql = `
      SELECT p.*, u.user_name as responsible_user_name
      FROM pis_project p
      LEFT JOIN sys_user u ON p.responsible_user_id = u.id
      WHERE 1=1
    `
    const params = []
    
    if (projectName) {
      sql += ' AND p.project_name LIKE ?'
      params.push(`%${projectName}%`)
    }
    
    if (projectType) {
      sql += ' AND p.project_type = ?'
      params.push(projectType)
    }
    
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), Number(offset))
    
    const projects = await query(sql, params)
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM pis_project WHERE 1=1'
    const countParams = []
    
    if (projectName) {
      countSql += ' AND project_name LIKE ?'
      countParams.push(`%${projectName}%`)
    }
    if (projectType) {
      countSql += ' AND project_type = ?'
      countParams.push(projectType)
    }
    
    const [countResult] = await query(countSql, countParams)
    
    // 计算每个项目的达标率
    for (const project of projects) {
      const achievementResult = await calculateAchievementRate(project.id)
      project.achievementRate = achievementResult.weightedRate
    }
    
    res.json({
      code: 200,
      data: {
        list: projects,
        total: countResult.total
      }
    })
  } catch (error) {
    console.error('获取项目列表失败:', error)
    res.status(500).json({ code: 500, message: '获取项目列表失败' })
  }
}

// 获取项目详情
export const getProjectDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const projects = await query(`
      SELECT p.*, u.user_name as responsible_user_name
      FROM pis_project p
      LEFT JOIN sys_user u ON p.responsible_user_id = u.id
      WHERE p.id = ?
    `, [id])
    
    if (projects.length === 0) {
      return res.status(404).json({ code: 404, message: '项目不存在' })
    }
    
    const project = projects[0]
    
    // 获取项目成员
    const members = await query(`
      SELECT pm.*, u.user_name
      FROM pis_project_member pm
      LEFT JOIN sys_user u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [id])
    
    project.members = members
    
    // 获取达标率
    const achievement = await calculateAchievementRate(id)
    project.achievementRate = achievement
    
    res.json({
      code: 200,
      data: project
    })
  } catch (error) {
    console.error('获取项目详情失败:', error)
    res.status(500).json({ code: 500, message: '获取项目详情失败' })
  }
}

// 创建项目
export const createProject = async (req, res) => {
  try {
    const {
      projectName,
      projectType,
      startDate,
      endDate,
      responsibleUserId,
      members = [],
      description
    } = req.body
    
    await transaction(async (connection) => {
      // 生成项目编号
      const date = new Date()
      const year = date.getFullYear()
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM pis_project WHERE YEAR(created_at) = ?',
        [year]
      )
      const count = countResult[0].count + 1
      const projectCode = `PJ-${year}-${String(count).padStart(3, '0')}`
      
      // 创建项目
      const [projectResult] = await connection.execute(
        `INSERT INTO pis_project (project_code, project_name, project_type, start_date, end_date, 
         responsible_user_id, description, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
        [projectCode, projectName, projectType, startDate, endDate, responsibleUserId, description, req.userId]
      )
      
      const projectId = projectResult.insertId
      
      // 添加项目成员
      for (const member of members) {
        await connection.execute(
          'INSERT INTO pis_project_member (project_id, user_id, role) VALUES (?, ?, ?)',
          [projectId, member.userId, member.role || '成员']
        )
      }
      
      // 根据项目类型创建默认指标
      await createDefaultIndicators(connection, projectId, projectType)
      
      return projectId
    })
    
    res.json({
      code: 200,
      message: '项目创建成功'
    })
  } catch (error) {
    console.error('创建项目失败:', error)
    res.status(500).json({ code: 500, message: '创建项目失败' })
  }
}

// 更新项目
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params
    const {
      projectName,
      projectType,
      startDate,
      endDate,
      responsibleUserId,
      members = [],
      description
    } = req.body
    
    await transaction(async (connection) => {
      // 更新项目
      await connection.execute(
        `UPDATE pis_project SET project_name = ?, project_type = ?, start_date = ?, 
         end_date = ?, responsible_user_id = ?, description = ? WHERE id = ?`,
        [projectName, projectType, startDate, endDate, responsibleUserId, description, id]
      )
      
      // 删除原有成员
      await connection.execute(
        'DELETE FROM pis_project_member WHERE project_id = ?',
        [id]
      )
      
      // 添加新成员
      for (const member of members) {
        await connection.execute(
          'INSERT INTO pis_project_member (project_id, user_id, role) VALUES (?, ?, ?)',
          [id, member.userId, member.role || '成员']
        )
      }
    })
    
    res.json({
      code: 200,
      message: '项目更新成功'
    })
  } catch (error) {
    console.error('更新项目失败:', error)
    res.status(500).json({ code: 500, message: '更新项目失败' })
  }
}

// 删除项目
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params
    
    await query('DELETE FROM pis_project WHERE id = ?', [id])
    
    res.json({
      code: 200,
      message: '项目删除成功'
    })
  } catch (error) {
    console.error('删除项目失败:', error)
    res.status(500).json({ code: 500, message: '删除项目失败' })
  }
}

// 获取项目达标率
export const getProjectAchievementRate = async (req, res) => {
  try {
    const { id } = req.params
    const result = await calculateAchievementRate(id)
    
    res.json({
      code: 200,
      data: result
    })
  } catch (error) {
    console.error('获取达标率失败:', error)
    res.status(500).json({ code: 500, message: '获取达标率失败' })
  }
}

// 计算达标率
async function calculateAchievementRate(projectId) {
  const indicators = await query(`
    SELECT pi.*, i.indicator_name, i.target_type, i.target_value, i.weight
    FROM pis_project_indicator pi
    JOIN pis_indicator i ON pi.indicator_id = i.id
    WHERE pi.project_id = ?
  `, [projectId])
  
  if (indicators.length === 0) {
    return {
      totalIndicators: 0,
      achievedCount: 0,
      simpleRate: 0,
      weightedRate: 0,
      indicators: []
    }
  }
  
  let totalWeight = 0
  let weightedSum = 0
  let achievedCount = 0
  
  const indicatorDetails = indicators.map(ind => {
    const rate = calculateSingleAchievementRate(ind)
    
    if (rate >= 100) {
      achievedCount++
    }
    
    totalWeight += ind.weight
    weightedSum += rate * ind.weight
    
    return {
      ...ind,
      achievementRate: parseFloat(rate.toFixed(2))
    }
  })
  
  const simpleRate = (achievedCount / indicators.length) * 100
  const weightedRate = totalWeight > 0 ? weightedSum / totalWeight : 0
  
  return {
    totalIndicators: indicators.length,
    achievedCount,
    simpleRate: parseFloat(simpleRate.toFixed(2)),
    weightedRate: parseFloat(weightedRate.toFixed(2)),
    indicators: indicatorDetails
  }
}

// 计算单个指标达标率
function calculateSingleAchievementRate(indicator) {
  const { target_type, target_value, target_min, target_max, actual_value } = indicator
  
  if (actual_value === null || actual_value === undefined) {
    return 0
  }
  
  const actual = parseFloat(actual_value)
  const target = parseFloat(target_value)
  
  switch (target_type) {
    case 'GE': // 大于等于
      return actual >= target ? 100 : (actual / target * 100)
    
    case 'LE': // 小于等于
      return actual <= target ? 100 : (target / actual * 100)
    
    case 'EQ': // 等于
      if (actual === target) return 100
      return Math.max(0, (1 - Math.abs(actual - target) / target) * 100)
    
    case 'RANGE': // 范围
      const min = parseFloat(target_min)
      const max = parseFloat(target_max)
      if (actual >= min && actual <= max) {
        return 100
      } else if (actual < min) {
        return (actual / min) * 100
      } else {
        return (max / actual) * 100
      }
    
    default:
      return 0
  }
}

// 创建默认指标
async function createDefaultIndicators(connection, projectId, projectType) {
  const defaultIndicators = {
    'ISO22163': [
      { name: '体系文件完成率', weight: 20, target: 100, type: 'GE' },
      { name: '内审不符合项关闭率', weight: 15, target: 100, type: 'GE' },
      { name: '培训计划完成率', weight: 10, target: 100, type: 'GE' },
      { name: 'FAI一次通过率', weight: 15, target: 95, type: 'GE' },
      { name: '设计评审通过率', weight: 15, target: 100, type: 'GE' },
      { name: '变更闭环率', weight: 15, target: 100, type: 'GE' },
      { name: '客户满意度', weight: 10, target: 90, type: 'GE' }
    ],
    'ISO9001': [
      { name: '质量目标达成率', weight: 30, target: 100, type: 'GE' },
      { name: '过程合格率', weight: 25, target: 98, type: 'GE' },
      { name: '客户投诉处理率', weight: 25, target: 100, type: 'GE' },
      { name: '改进项完成率', weight: 20, target: 100, type: 'GE' }
    ]
  }
  
  const indicators = defaultIndicators[projectType] || defaultIndicators['ISO22163']
  
  for (const ind of indicators) {
    // 先创建指标定义
    const [indicatorResult] = await connection.execute(
      `INSERT INTO pis_indicator (indicator_code, indicator_name, category, unit, weight, 
       target_type, target_value, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [`IND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ind.name, projectType, '%', ind.weight, ind.type, ind.target]
    )
    
    // 创建项目指标实例
    await connection.execute(
      `INSERT INTO pis_project_indicator (project_id, indicator_id, weight, target_value, 
       status, responsible_user_id) VALUES (?, ?, ?, ?, 'PENDING', ?)`,
      [projectId, indicatorResult.insertId, ind.weight, ind.target, 1]
    )
  }
}
