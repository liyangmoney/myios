-- ============================================
-- PDCA 质量事件附件字段添加脚本 (MySQL 5.7/8.0 兼容版)
-- ============================================

-- 检查当前数据库
SELECT DATABASE() AS current_database;

-- ============================================
-- 添加各阶段附件字段（兼容旧版本 MySQL）
-- ============================================

-- 1. Plan 阶段附件字段
ALTER TABLE quality_event 
ADD COLUMN plan_files TEXT COMMENT 'Plan stage attachments (JSON array)';

-- 2. Do 阶段附件字段
ALTER TABLE quality_event 
ADD COLUMN implementation_files TEXT COMMENT 'Do stage attachments (JSON array)';

-- 3. Check 阶段附件字段  
ALTER TABLE quality_event 
ADD COLUMN check_files TEXT COMMENT 'Check stage attachments (JSON array)';

-- 4. Act 阶段附件字段
ALTER TABLE quality_event 
ADD COLUMN act_files TEXT COMMENT 'Act stage attachments (JSON array)';

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

-- 完成
SELECT 'PDCA attachment fields added!' AS result;
