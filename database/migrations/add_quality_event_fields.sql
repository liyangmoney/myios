-- 添加质量事件表缺失字段（如果已创建表但没有这些字段）

ALTER TABLE quality_event 
ADD COLUMN IF NOT EXISTS current_handler_id INT COMMENT '当前处理人ID',
ADD COLUMN IF NOT EXISTS current_handler_name VARCHAR(100) COMMENT '当前处理人姓名',
ADD COLUMN IF NOT EXISTS next_handler_id INT COMMENT '下一步处理人ID',
ADD COLUMN IF NOT EXISTS next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名',
ADD COLUMN IF NOT EXISTS next_step VARCHAR(50) COMMENT '下一步操作：PLAN/DO/CHECK/ACT',
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP NULL COMMENT '最后提醒时间';

-- 修改外键（如果之前没有）
-- 注意：MySQL 8.0+ 才支持 IF NOT EXISTS 用于外键检查
-- 如果外键已存在会报错，可以忽略

-- 添加外键（可选，如果之前没有创建的话）
-- ALTER TABLE quality_event 
-- ADD FOREIGN KEY (current_handler_id) REFERENCES sys_user(id),
-- ADD FOREIGN KEY (next_handler_id) REFERENCES sys_user(id);
