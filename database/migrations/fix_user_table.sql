-- ============================================
-- 用户表字段更新迁移脚本
-- 添加缺失的 department、remark、created_by、deleted_at 字段
-- ============================================

USE pis_system;

-- 1. 添加 department 字段（如果不存在）
SET @dbname = DATABASE();
SET @tablename = 'sys_user';
SET @columnname = 'department';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) COMMENT "所属部门" AFTER phone'),
  'SELECT 1'
));
PREPARE addColumn FROM @preparedStatement;
EXECUTE addColumn;
DEALLOCATE PREPARE addColumn;

-- 2. 添加 remark 字段（如果不存在）
SET @columnname = 'remark';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT COMMENT "备注" AFTER status'),
  'SELECT 1'
));
PREPARE addColumn FROM @preparedStatement;
EXECUTE addColumn;
DEALLOCATE PREPARE addColumn;

-- 3. 添加 created_by 字段（如果不存在）
SET @columnname = 'created_by';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT COMMENT "创建人ID" AFTER remark'),
  'SELECT 1'
));
PREPARE addColumn FROM @preparedStatement;
EXECUTE addColumn;
DEALLOCATE PREPARE addColumn;

-- 4. 添加 deleted_at 字段（如果不存在）
SET @columnname = 'deleted_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL COMMENT "软删除时间" AFTER updated_at'),
  'SELECT 1'
));
PREPARE addColumn FROM @preparedStatement;
EXECUTE addColumn;
DEALLOCATE PREPARE addColumn;

-- 5. 创建部门表（如果不存在）
CREATE TABLE IF NOT EXISTS sys_department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) COMMENT '部门编码',
    parent_id INT DEFAULT 0 COMMENT '父部门ID，0为顶级部门',
    sort_order INT DEFAULT 0 COMMENT '排序号',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='部门表';

-- 6. 插入默认部门数据（如果部门表为空）
INSERT INTO sys_department (dept_name, dept_code, parent_id, sort_order)
SELECT * FROM (
    SELECT '销售部' as dept_name, 'SALES' as dept_code, 0 as parent_id, 1 as sort_order UNION ALL
    SELECT '研发部', 'R&D', 0, 2 UNION ALL
    SELECT '质量部', 'QUALITY', 0, 3 UNION ALL
    SELECT '人力资源部', 'HR', 0, 4 UNION ALL
    SELECT '采购部', 'PROCUREMENT', 0, 5 UNION ALL
    SELECT '生产部', 'PRODUCTION', 0, 6 UNION ALL
    SELECT '财务部', 'FINANCE', 0, 7 UNION ALL
    SELECT '行政部', 'ADMIN', 0, 8
) AS tmp
WHERE NOT EXISTS (
    SELECT 1 FROM sys_department LIMIT 1
);

-- 7. 删除不再使用的 dept_id 字段（如果存在）
SET @columnname = 'dept_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' DROP COLUMN ', @columnname),
  'SELECT 1'
));
PREPARE dropColumn FROM @preparedStatement;
EXECUTE dropColumn;
DEALLOCATE PREPARE dropColumn;

SELECT '用户表迁移完成！' as message;
