-- 添加质量事件表缺失字段（如果已创建表但没有这些字段）
-- 对于已存在的字段会报错，请忽略或使用下面的存储过程方式

-- 方式1：直接执行（已存在的字段会报错，忽略即可）
ALTER TABLE quality_event 
ADD COLUMN current_handler_id INT COMMENT '当前处理人ID',
ADD COLUMN current_handler_name VARCHAR(100) COMMENT '当前处理人姓名',
ADD COLUMN next_handler_id INT COMMENT '下一步处理人ID',
ADD COLUMN next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名',
ADD COLUMN next_step VARCHAR(50) COMMENT '下一步操作：PLAN/DO/CHECK/ACT',
ADD COLUMN last_reminder_at TIMESTAMP NULL COMMENT '最后提醒时间',
ADD COLUMN plan_files TEXT COMMENT 'Plan阶段附件（JSON数组）',
ADD COLUMN check_files TEXT COMMENT 'Check阶段附件（JSON数组）',
ADD COLUMN act_files TEXT COMMENT 'Act阶段附件（JSON数组）';

-- 方式2：使用存储过程（如果上面报错，请用这个）
-- 先检查并添加单个字段，重复执行不会报错
/*
DELIMITER $$

CREATE PROCEDURE add_quality_event_columns_if_not_exists()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'current_handler_id'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN current_handler_id INT COMMENT '当前处理人ID';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'current_handler_name'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN current_handler_name VARCHAR(100) COMMENT '当前处理人姓名';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'next_handler_id'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN next_handler_id INT COMMENT '下一步处理人ID';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'next_handler_name'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'next_step'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN next_step VARCHAR(50) COMMENT '下一步操作：PLAN/DO/CHECK/ACT';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'last_reminder_at'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN last_reminder_at TIMESTAMP NULL COMMENT '最后提醒时间';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'plan_files'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN plan_files TEXT COMMENT 'Plan阶段附件（JSON数组）';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'check_files'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN check_files TEXT COMMENT 'Check阶段附件（JSON数组）';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'act_files'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN act_files TEXT COMMENT 'Act阶段附件（JSON数组）';
    END IF;
END$$

DELIMITER ;

CALL add_quality_event_columns_if_not_exists();
DROP PROCEDURE IF EXISTS add_quality_event_columns_if_not_exists;
*/
