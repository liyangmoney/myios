-- 添加质量事件表缺失字段
-- 使用存储过程自动跳过已存在的字段

DELIMITER $$

DROP PROCEDURE IF EXISTS add_quality_event_columns$$

CREATE PROCEDURE add_quality_event_columns()
BEGIN
    -- current_handler_id
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'current_handler_id'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN current_handler_id INT COMMENT '当前处理人ID';
        SELECT 'Added column: current_handler_id' AS message;
    ELSE
        SELECT 'Column already exists: current_handler_id' AS message;
    END IF;
    
    -- current_handler_name
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'current_handler_name'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN current_handler_name VARCHAR(100) COMMENT '当前处理人姓名';
        SELECT 'Added column: current_handler_name' AS message;
    ELSE
        SELECT 'Column already exists: current_handler_name' AS message;
    END IF;
    
    -- next_handler_id
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'next_handler_id'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN next_handler_id INT COMMENT '下一步处理人ID';
        SELECT 'Added column: next_handler_id' AS message;
    ELSE
        SELECT 'Column already exists: next_handler_id' AS message;
    END IF;
    
    -- next_handler_name
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'next_handler_name'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名';
        SELECT 'Added column: next_handler_name' AS message;
    ELSE
        SELECT 'Column already exists: next_handler_name' AS message;
    END IF;
    
    -- next_step
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'next_step'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN next_step VARCHAR(50) COMMENT '下一步操作：PLAN/DO/CHECK/ACT';
        SELECT 'Added column: next_step' AS message;
    ELSE
        SELECT 'Column already exists: next_step' AS message;
    END IF;
    
    -- last_reminder_at
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'last_reminder_at'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN last_reminder_at TIMESTAMP NULL COMMENT '最后提醒时间';
        SELECT 'Added column: last_reminder_at' AS message;
    ELSE
        SELECT 'Column already exists: last_reminder_at' AS message;
    END IF;
    
    -- plan_files
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'plan_files'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN plan_files TEXT COMMENT 'Plan阶段附件（JSON数组）';
        SELECT 'Added column: plan_files' AS message;
    ELSE
        SELECT 'Column already exists: plan_files' AS message;
    END IF;
    
    -- check_files
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'check_files'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN check_files TEXT COMMENT 'Check阶段附件（JSON数组）';
        SELECT 'Added column: check_files' AS message;
    ELSE
        SELECT 'Column already exists: check_files' AS message;
    END IF;
    
    -- act_files
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'act_files'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN act_files TEXT COMMENT 'Act阶段附件（JSON数组）';
        SELECT 'Added column: act_files' AS message;
    ELSE
        SELECT 'Column already exists: act_files' AS message;
    END IF;
    
    SELECT 'All columns processed successfully!' AS message;
END$$

DELIMITER ;

-- 执行存储过程
CALL add_quality_event_columns();

-- 删除存储过程（可选）
DROP PROCEDURE IF EXISTS add_quality_event_columns;
