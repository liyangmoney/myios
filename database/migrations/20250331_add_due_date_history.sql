-- ============================================
-- MyIOS 截止时间修改记录表
-- ============================================

USE pis_system;

-- 添加当前截止时间字段（记录当前生效的截止时间）
ALTER TABLE quality_event ADD COLUMN current_due_date DATE COMMENT '当前截止时间';

-- 创建截止时间修改记录表
CREATE TABLE IF NOT EXISTS quality_event_due_date_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '事件ID',
    old_due_date DATE COMMENT '原截止时间',
    new_due_date DATE NOT NULL COMMENT '新截止时间',
    reason VARCHAR(500) NOT NULL COMMENT '修改原因',
    modified_by INT NOT NULL COMMENT '修改人ID',
    modified_by_name VARCHAR(100) COMMENT '修改人姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
    INDEX idx_event_id (event_id)
) COMMENT='质量事件截止时间修改记录表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 将现有数据的 due_date 复制到 current_due_date
UPDATE quality_event SET current_due_date = due_date WHERE current_due_date IS NULL;
