-- MyIOS 质量事件表结构变更 SQL
-- 执行日期: 2026-03-23

-- 1. 重命名和新增字段
ALTER TABLE quality_event 
-- 删除旧字段
DROP COLUMN IF EXISTS event_type,
DROP COLUMN IF EXISTS department,

-- 新增字段
ADD COLUMN product_stage VARCHAR(50) NULL COMMENT '产品阶段',
ADD COLUMN product_type VARCHAR(100) NULL COMMENT '产品类型',
ADD COLUMN project_no VARCHAR(100) NULL COMMENT '项目号/生产任务单号',
ADD COLUMN customer VARCHAR(100) NULL COMMENT '用户',
ADD COLUMN keywords VARCHAR(200) NULL COMMENT '关键字',
ADD COLUMN problem_type VARCHAR(50) NULL COMMENT '问题类型',

-- severity 字段保持，但改为存储逗号分隔的多选值
MODIFY COLUMN severity VARCHAR(500) NULL COMMENT '故障严重程度（多选，逗号分隔）',

ADD COLUMN related_parts TEXT NULL COMMENT '涉及相关部件（多选，逗号分隔）',
ADD COLUMN discovery_form TEXT NULL COMMENT '问题发现形式（多选，逗号分隔）',

-- 责任人改为多选
ADD COLUMN responsible_ids JSON NULL COMMENT '责任人ID列表（多选）',
ADD COLUMN supervisor_id INT NULL COMMENT '监督/确认人ID',
ADD COLUMN supervisor_name VARCHAR(50) NULL COMMENT '监督/确认人姓名';

-- 2. 如果有数据，将旧字段数据迁移到新字段
-- UPDATE quality_event SET product_stage = '交付后正式使用阶段' WHERE event_type IS NOT NULL;

-- 3. 删除旧字段（确认迁移完成后执行）
-- ALTER TABLE quality_event DROP COLUMN responsible_id;

-- 4. 创建索引优化查询
CREATE INDEX idx_product_stage ON quality_event(product_stage);
CREATE INDEX idx_product_type ON quality_event(product_type);
CREATE INDEX idx_problem_type ON quality_event(problem_type);
