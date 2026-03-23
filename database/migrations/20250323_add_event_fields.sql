-- ============================================
-- MyIOS 质量事件表结构升级脚本
-- 添加新字段支持整改需求
-- ============================================

USE pis_system;

-- 添加新字段到 quality_event表（使用单独的ALTER语句避免语法问题）

-- 产品阶段（替换原来的 event_type）
ALTER TABLE quality_event ADD COLUMN product_stage VARCHAR(50) COMMENT '产品阶段：设计阶段/研发制造阶段/生产阶段/试用阶段/交付后正式使用阶段';

-- 产品类型
ALTER TABLE quality_event ADD COLUMN product_type VARCHAR(50) COMMENT '产品类型：地铁机器人/国铁巡检仪/国铁功能模块-扣件/国铁功能模块-位移/国铁功能模块-廓形/车载系统';

-- 项目号/生产任务单号
ALTER TABLE quality_event ADD COLUMN project_no VARCHAR(100) COMMENT '项目号/生产任务单号';

-- 用户
ALTER TABLE quality_event ADD COLUMN customer VARCHAR(200) COMMENT '用户';

-- 关键字
ALTER TABLE quality_event ADD COLUMN keywords VARCHAR(500) COMMENT '关键字';

-- 问题类型
ALTER TABLE quality_event ADD COLUMN problem_type VARCHAR(50) COMMENT '问题类型：软件算法/嵌入式硬件/机械电器';

-- 涉及相关部件（多选存储为JSON数组或逗号分隔）
ALTER TABLE quality_event ADD COLUMN related_parts TEXT COMMENT '涉及相关部件 JSON数组';

-- 问题发现/提出形式（多选）
ALTER TABLE quality_event ADD COLUMN discovery_form TEXT COMMENT '问题发现/提出形式 JSON数组';

-- 责任人IDs（多选，JSON数组）
ALTER TABLE quality_event ADD COLUMN responsible_ids TEXT COMMENT '责任人ID列表 JSON数组';

-- 监督/确认人
ALTER TABLE quality_event ADD COLUMN supervisor_id INT COMMENT '监督/确认人ID';
ALTER TABLE quality_event ADD COLUMN supervisor_name VARCHAR(100) COMMENT '监督/确认人姓名';

-- 变更相关
ALTER TABLE quality_event ADD COLUMN is_changed TINYINT DEFAULT 0 COMMENT '是否由变更产生：0否 1是';
ALTER TABLE quality_event ADD COLUMN change_source_id INT COMMENT '变更来源事件ID';
ALTER TABLE quality_event ADD COLUMN change_source_no VARCHAR(50) COMMENT '变更来源事件编号';

-- A阶段原因类型（多选）
ALTER TABLE quality_event ADD COLUMN cause_type TEXT COMMENT '原因类型 JSON数组：设计考虑不周/培训不足/人员能力不足/流程不全';

-- 问题描述附件
ALTER TABLE quality_event ADD COLUMN description_files TEXT COMMENT '问题描述附件 JSON数组';

-- 创建索引优化查询
CREATE INDEX idx_product_stage ON quality_event(product_stage);
CREATE INDEX idx_product_type ON quality_event(product_type);
CREATE INDEX idx_project_no ON quality_event(project_no);
CREATE INDEX idx_problem_type ON quality_event(problem_type);
CREATE INDEX idx_supervisor_id ON quality_event(supervisor_id);
CREATE INDEX idx_is_changed ON quality_event(is_changed);
CREATE INDEX idx_change_source_id ON quality_event(change_source_id);

-- 验证迁移结果
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = 'pis_system'
  AND COLUMN_NAME IN (
    'product_stage', 'product_type', 'project_no', 'customer', 
    'keywords', 'problem_type', 'related_parts', 'discovery_form',
    'responsible_ids', 'supervisor_id', 'supervisor_name',
    'is_changed', 'change_source_id', 'change_source_no', 'cause_type',
    'description_files'
  )
ORDER BY ORDINAL_POSITION;