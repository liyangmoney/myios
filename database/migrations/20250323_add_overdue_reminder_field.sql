-- ============================================
-- 添加过期提醒时间字段
-- ============================================

USE pis_system;

-- 添加最后过期提醒时间字段（兼容旧版本MySQL）
ALTER TABLE quality_event ADD COLUMN last_overdue_reminder_at DATETIME COMMENT '最后过期提醒时间';

-- 验证
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = 'pis_system'
  AND COLUMN_NAME = 'last_overdue_reminder_at';