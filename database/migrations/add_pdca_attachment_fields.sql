-- ============================================
-- PDCA 质量事件附件字段添加脚本
-- 执行此脚本添加 Plan/Do/Check/Act 各阶段附件字段
-- ============================================

-- 检查当前数据库
SELECT DATABASE() AS current_database;

-- 查看当前表结构（可选）
-- DESCRIBE quality_event;

-- ============================================
-- 添加各阶段附件字段
-- ============================================

-- 1. Plan 阶段附件字段
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS plan_files TEXT COMMENT 'Plan阶段附件（JSON数组）';

-- 2. Do 阶段附件字段（注意字段名是 implementation_files）
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS implementation_files TEXT COMMENT 'Do阶段实施附件（JSON数组）';

-- 3. Check 阶段附件字段
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS check_files TEXT COMMENT 'Check阶段附件（JSON数组）';

-- 4. Act 阶段附件字段
ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS act_files TEXT COMMENT 'Act阶段附件（JSON数组）';

-- ============================================
-- 验证字段是否添加成功
-- ============================================

SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('plan_files', 'implementation_files', 'check_files', 'act_files')
ORDER BY COLUMN_NAME;

-- 添加完成提示
SELECT 'PDCA attachment fields added successfully!' AS result;
