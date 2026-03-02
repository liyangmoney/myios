-- ============================================
-- PDCA 质量事件附件字段添加脚本
-- 只添加缺失的字段
-- ============================================

-- 检查当前数据库
SELECT DATABASE() AS current_database;

-- 查看当前已有字段
SELECT COLUMN_NAME, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('plan_files', 'implementation_files', 'check_files', 'act_files');

-- 添加缺失字段（根据上面查询结果，只添加不存在的）

-- plan_files（如果不存在）
ALTER TABLE quality_event 
ADD COLUMN plan_files TEXT COMMENT 'Plan stage attachments (JSON array)';

-- implementation_files（如果不存在）
-- ALTER TABLE quality_event 
-- ADD COLUMN implementation_files TEXT COMMENT 'Do stage attachments (JSON array)';

-- check_files（如果不存在）
ALTER TABLE quality_event 
ADD COLUMN check_files TEXT COMMENT 'Check stage attachments (JSON array)';

-- act_files（如果不存在）
ALTER TABLE quality_event 
ADD COLUMN act_files TEXT COMMENT 'Act stage attachments (JSON array)';

-- 验证最终结果
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
SELECT 'PDCA fields check completed!' AS result;
