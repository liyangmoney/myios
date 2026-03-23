-- ============================================
-- 更新部门表数据为新的13个部门
-- ============================================

USE pis_system;

-- 清空现有部门数据
DELETE FROM sys_department;

-- 插入新的13个部门
INSERT INTO sys_department (dept_name, dept_code, parent_id, sort_order, status) VALUES
('品控中心', 'QUALITY', 0, 1, 1),
('轨道技术研究院', 'RAIL_RD', 0, 2, 1),
('生产中心', 'PRODUCTION', 0, 3, 1),
('销售部', 'SALES', 0, 4, 1),
('技术支持中心', 'TECH_SUPPORT', 0, 5, 1),
('采购中心', 'PROCUREMENT', 0, 6, 1),
('财务部', 'FINANCE', 0, 7, 1),
('创新技术研究院', 'INNO_RD', 0, 8, 1),
('软件中心', 'SOFTWARE', 0, 9, 1),
('人力资源中心', 'HR', 0, 10, 1),
('综合行政部', 'ADMIN', 0, 11, 1),
('总经办', 'CEO_OFFICE', 0, 12, 1),
('科技管理部', 'TECH_MGMT', 0, 13, 1);

-- 验证更新结果
SELECT * FROM sys_department ORDER BY sort_order;