import { query } from '../config/database.js'

// 获取项目指标列表
export const getProjectIndicators = async (req, res) => {
  try {
    const { projectId } = req.params
    
    const indicators = await query(`
      SELECT pi.*, i.indicator_name, i.indicator_code, i.unit, i.target_type
      FROM pis_project_indicator pi
      JOIN pis_indicator i ON pi.indicator_id = i.id
      WHERE pi.project_id = ?
      ORDER BY pi.id
    `, [projectId])
    
    res.json({
      code: 200,
      data: indicators
    })
  } catch (error) {
    console.error('获取指标列表失败:', error)
    res.status(500).json({ code: 500, message: '获取指标列表失败' })
  }
}

// 获取指标详情
export const getIndicatorDetail = async (req, res) => {
  try {
    const { id } = req.params
    
    const indicators = await query(`
      SELECT pi.*, i.indicator_name, i.indicator_code, i.unit, i.target_type,
             p.project_name, u.user_name as responsible_user_name
      FROM pis_project_indicator pi
      JOIN pis_indicator i ON pi.indicator_id = i.id
      JOIN pis_project p ON pi.project_id = p.id
      LEFT JOIN sys_user u ON pi.responsible_user_id = u.id
      WHERE pi.id = ?
    `, [id])
    
    if (indicators.length === 0) {
      return res.status(404).json({ code: 404, message: '指标不存在' })
    }
    
    // 获取填报记录
    const records = await query(`
      SELECT r.*, u.user_name as reporter_name
      FROM pis_indicator_record r
      LEFT JOIN sys_user u ON r.reporter_id = u.id
      WHERE r.project_indicator_id = ?
      ORDER BY r.created_at DESC
    `, [id])
    
    const indicator = indicators[0]
    indicator.records = records
    
    res.json({
      code: 200,
      data: indicator
    })
  } catch (error) {
    console.error('获取指标详情失败:', error)
    res.status(500).json({ code: 500, message: '获取指标详情失败' })
  }
}

// 提交指标填报
export const submitIndicatorRecord = async (req, res) => {
  try {
    const { id } = req.params
    const { actualValue, evidenceDescription } = req.body
    
    // 获取指标信息
    const indicators = await query(
      'SELECT * FROM pis_project_indicator WHERE id = ?',
      [id]
    )
    
    if (indicators.length === 0) {
      return res.status(404).json({ code: 404, message: '指标不存在' })
    }
    
    const indicator = indicators[0]
    
    // 获取目标信息
    const [targetInfo] = await query(
      'SELECT target_type, target_value, target_min, target_max, weight FROM pis_indicator WHERE id = ?',
      [indicator.indicator_id]
    )
    
    // 计算达标率
    const achievementRate = calculateAchievementRate(
      { ...targetInfo, actual_value: actualValue }
    )
    
    // 创建填报记录
    await query(
      `INSERT INTO pis_indicator_record 
       (project_indicator_id, reporting_date, actual_value, evidence_description, reporter_id, status) 
       VALUES (?, CURDATE(), ?, ?, ?, 'SUBMITTED')`,
      [id, actualValue, evidenceDescription, req.userId]
    )
    
    // 更新指标实际值和达标率
    await query(
      `UPDATE pis_project_indicator 
       SET actual_value = ?, achievement_rate = ?, status = 'REPORTED', updated_at = NOW()
       WHERE id = ?`,
      [actualValue, achievementRate, id]
    )
    
    res.json({
      code: 200,
      message: '填报成功',
      data: { achievementRate }
    })
  } catch (error) {
    console.error('填报失败:', error)
    res.status(500).json({ code: 500, message: '填报失败' })
  }
}

// 计算达标率
function calculateAchievementRate(indicator) {
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
