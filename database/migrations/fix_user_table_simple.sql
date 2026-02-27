-- ============================================
-- 快速修复脚本 - 用户表字段补充
-- 直接在 MySQL 命令行执行: mysql -u root -p pis_system < fix_user_table_simple.sql
-- ============================================

USE pis_system;

-- 添加 department 字段
ALTER TABLE sys_user 
ADD COLUMN IF NOT EXISTS department VARCHAR(100) COMMENT '所属部门' AFTER phone,
ADD COLUMN IF NOT EXISTS remark TEXT COMMENT '备注' AFTER status,
ADD COLUMN IF NOT EXISTS created_by INT COMMENT '创建人ID' AFTER remark,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间' AFTER updated_at;

-- 创建部门表
CREATE TABLE IF NOT EXISTS sys_department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) COMMENT '部门编码',
    parent_id INT DEFAULT 0 COMMENT '父部门ID，0为顶级部门',
    sort_order INT DEFAULT 0 COMMENT '排序号',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='部门表';

-- 插入默认部门（仅在表为空时）
INSERT INTO sys_department (dept_name, dept_code, parent_id, sort_order)
SELECT * FROM (SELECT 1 as cnt) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM sys_department LIMIT 1);

INSERT IGNORE INTO sys_department (dept_name, dept_code, parent_id, sort_order) VALUES
('销售部', 'SALES', 0, 1),
('研发部', 'R&D', 0, 2),
('质量部', 'QUALITY', 0, 3),
('人力资源部', 'HR', 0, 4),
('采购部', 'PROCUREMENT', 0, 5),
('生产部', 'PRODUCTION', 0, 6),
('财务部', 'FINANCE', 0, 7),
('行政部', 'ADMIN', 0, 8);

-- 删除旧的 dept_id 字段（如果存在）
SET @dbname = DATABASE();
SET @tablename = 'sys_user';
SET @columnname = 'dept_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'ALTER TABLE sys_user DROP COLUMN dept_id',
  'SELECT "dept_id 字段不存在，跳过"'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ 用户表字段修复完成！' as message;
