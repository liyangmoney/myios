-- ============================================
-- 修改severity字段长度，支持多选存储
-- ============================================

USE pis_system;

-- 修改severity字段为TEXT类型，支持存储多选值
ALTER TABLE quality_event MODIFY COLUMN severity TEXT COMMENT '故障严重程度（多选存储）';

-- 验证修改结果
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = 'pis_system'
  AND COLUMN_NAME = 'severity';