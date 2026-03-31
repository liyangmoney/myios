-- ============================================
-- MyIOS 质量事件表结构升级 - 新增"指派"阶段
-- ============================================

USE pis_system;

-- 1. 添加责任部门字段（多选，JSON数组存储部门名称）
ALTER TABLE quality_event ADD COLUMN responsible_departments TEXT COMMENT '责任部门列表 JSON数组';

-- 2. 添加部门负责人字段（多选，JSON数组存储用户ID）
ALTER TABLE quality_event ADD COLUMN dept_leader_ids TEXT COMMENT '部门负责人ID列表 JSON数组';
ALTER TABLE quality_event ADD COLUMN dept_leader_names TEXT COMMENT '部门负责人姓名列表 JSON数组';

-- 3. 创建索引优化查询
CREATE INDEX idx_responsible_departments ON quality_event(responsible_departments(100));
CREATE INDEX idx_dept_leader_ids ON quality_event(dept_leader_ids(100));

-- 验证迁移结果
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'quality_event' 
  AND TABLE_SCHEMA = 'pis_system'
  AND COLUMN_NAME IN (
    'responsible_departments', 'dept_leader_ids', 'dept_leader_names'
  )
ORDER BY ORDINAL_POSITION;
