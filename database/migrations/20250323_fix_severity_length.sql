-- ============================================
-- 修复 severity 字段长度问题
-- 先删除索引，再修改字段类型
-- ============================================

USE pis_system;

-- 查看现有索引
SHOW INDEX FROM quality_event WHERE Column_name = 'severity';

-- 删除 severity 字段的所有索引（如果有的话）
-- MySQL 8.0+ 支持 DROP INDEX IF EXISTS
-- 老版本需要手动判断
SET @drop_idx = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'pis_system' 
  AND TABLE_NAME = 'quality_event' 
  AND COLUMN_NAME = 'severity'
);

-- 修改 severity 字段为 TEXT 类型（不需要索引）
ALTER TABLE quality_event DROP INDEX idx_severity;

-- 修改字段类型
ALTER TABLE quality_event MODIFY COLUMN severity TEXT COMMENT '故障严重程度（多选存储）';

-- 验证修改结果
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = 'pis_system'
  AND COLUMN_NAME = 'severity';