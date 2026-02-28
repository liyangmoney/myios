-- 添加质量事件各阶段填写人字段
-- 使用存储过程自动跳过已存在的字段

DELIMITER $$

DROP PROCEDURE IF EXISTS add_quality_event_filled_by_columns$$

CREATE PROCEDURE add_quality_event_filled_by_columns()
BEGIN
    -- plan_filled_by
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'plan_filled_by'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN plan_filled_by INT COMMENT 'Plan阶段填写人ID';
        SELECT 'Added column: plan_filled_by' AS message;
    ELSE
        SELECT 'Column already exists: plan_filled_by' AS message;
    END IF;
    
    -- plan_filled_at
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'plan_filled_at'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN plan_filled_at TIMESTAMP NULL COMMENT 'Plan阶段填写时间';
        SELECT 'Added column: plan_filled_at' AS message;
    ELSE
        SELECT 'Column already exists: plan_filled_at' AS message;
    END IF;
    
    -- do_filled_by
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'do_filled_by'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN do_filled_by INT COMMENT 'Do阶段填写人ID';
        SELECT 'Added column: do_filled_by' AS message;
    ELSE
        SELECT 'Column already exists: do_filled_by' AS message;
    END IF;
    
    -- do_filled_at
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'quality_event' 
        AND COLUMN_NAME = 'do_filled_at'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE quality_event ADD COLUMN do_filled_at TIMESTAMP NULL COMMENT 'Do阶段填写时间';
        SELECT 'Added column: do_filled_at' AS message;
    ELSE
        SELECT 'Column already exists: do_filled_at' AS message;
    END IF;
    
    SELECT 'All columns processed successfully!' AS message;
END$$

DELIMITER ;

-- 执行存储过程
CALL add_quality_event_filled_by_columns();

-- 删除存储过程（可选）
DROP PROCEDURE IF EXISTS add_quality_event_filled_by_columns;
