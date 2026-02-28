-- 添加质量事件表缺失字段（如果已创建表但没有这些字段）

ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS current_handler_id INT COMMENT '当前处理人ID',
ADD COLUMN IF NOT EXISTS current_handler_name VARCHAR(100) COMMENT '当前处理人姓名',
ADD COLUMN IF NOT EXISTS next_handler_id INT COMMENT '下一步处理人ID',
ADD COLUMN IF NOT EXISTS next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名',
ADD COLUMN IF NOT EXISTS next_step VARCHAR(50) COMMENT '下一步操作：PLAN/DO/CHECK/ACT',
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP NULL COMMENT '最后提醒时间',
ADD COLUMN IF NOT EXISTS plan_files TEXT COMMENT 'Plan阶段附件（JSON数组）',
ADD COLUMN IF NOT EXISTS check_files TEXT COMMENT 'Check阶段附件（JSON数组）',
ADD COLUMN IF NOT EXISTS act_files TEXT COMMENT 'Act阶段附件（JSON数组）';
