-- 用户管理功能升级脚本
-- 执行时间: 2025-02-27

USE pis_system;

-- 1. 用户表扩展字段
ALTER TABLE sys_user 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) COMMENT '手机号' AFTER email,
ADD COLUMN IF NOT EXISTS created_by INT COMMENT '创建人ID' AFTER status,
ADD COLUMN IF NOT EXISTS remark TEXT COMMENT '备注' AFTER created_by,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间（软删除）';

-- 2. 创建部门表
CREATE TABLE IF NOT EXISTS sys_department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) COMMENT '部门编号',
    parent_id INT DEFAULT 0 COMMENT '上级部门ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='部门表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 初始化部门数据
INSERT INTO sys_department (dept_name, dept_code, sort_order) VALUES
('销售部', 'SALES', 1),
('研发部', 'R&D', 2),
('质量部', 'QA', 3),
('人力资源部', 'HR', 4),
('采购部', 'PROC', 5),
('生产中心', 'PROD', 6),
('技术支持中心', 'TECH', 7)
ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name);

-- 4. 更新现有用户的部门字段（如果为空，设置为质量部）
UPDATE sys_user SET department = '质量部' WHERE department IS NULL OR department = '';

-- 5. 创建操作日志表（可选，用于记录用户创建等操作）
CREATE TABLE IF NOT EXISTS sys_operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_type VARCHAR(50) COMMENT '操作类型',
    operation_desc TEXT COMMENT '操作描述',
    operator_id INT COMMENT '操作人ID',
    operator_name VARCHAR(100) COMMENT '操作人姓名',
    target_id INT COMMENT '被操作对象ID',
    target_type VARCHAR(50) COMMENT '被操作对象类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operator (operator_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created (created_at)
) COMMENT='操作日志表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;