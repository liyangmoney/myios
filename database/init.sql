-- ============================================
-- MyIOS 完整数据库初始化脚本
-- 版本: v1.8.2
-- 
-- 执行方式（二选一）：
-- 方式1：在 MySQL 客户端中直接执行此脚本
--   mysql -u root -p
--   source database/init.sql
-- 
-- 方式2：先创建数据库，再导入
--   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pis_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u root -p pis_system < database/init.sql
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS pis_system 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE pis_system;

-- ============================================
-- 1. 用户表
-- ============================================
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    user_name VARCHAR(200) COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    department VARCHAR(100) COMMENT '所属部门',
    role VARCHAR(50) DEFAULT 'user' COMMENT '角色：admin/user',
    is_dept_leader TINYINT DEFAULT 0 COMMENT '是否部门领导：1是 0否',
    job_title VARCHAR(100) COMMENT '职称（部门领导时必填）',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    remark TEXT COMMENT '备注',
    created_by INT COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间'
) COMMENT='用户表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO sys_user (username, password, user_name, email, role, status) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin@example.com', 'admin', 1)
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- ============================================
-- 2. 质量事件表
-- ============================================
DROP TABLE IF EXISTS quality_event;
CREATE TABLE quality_event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_no VARCHAR(50) NOT NULL UNIQUE COMMENT '事件编号',
    title VARCHAR(500) NOT NULL COMMENT '事件标题',
    description TEXT COMMENT '事件描述',
    
    -- 产品信息
    product_stage VARCHAR(50) COMMENT '产品阶段：设计阶段/研发制造阶段/生产阶段/试用阶段/交付后正式使用阶段',
    product_type VARCHAR(50) COMMENT '产品类型：地铁机器人/国铁巡检仪/国铁功能模块-扣件/国铁功能模块-位移/国铁功能模块-廓形/车载系统',
    project_no VARCHAR(100) COMMENT '项目号/生产任务单号',
    customer VARCHAR(200) COMMENT '用户',
    keywords VARCHAR(500) COMMENT '关键字',
    problem_type VARCHAR(50) COMMENT '问题类型：软件算法/嵌入式硬件/机械/电气',
    
    -- 严重程度和相关部件
    severity VARCHAR(20) COMMENT '严重度',
    related_parts TEXT COMMENT '涉及相关部件 JSON数组',
    discovery_form TEXT COMMENT '问题发现/提出形式 JSON数组',
    
    -- 责任部门和部门负责人（新增指派阶段）
    responsible_departments TEXT COMMENT '责任部门列表 JSON数组',
    dept_leader_ids TEXT COMMENT '部门负责人ID列表 JSON数组',
    dept_leader_names TEXT COMMENT '部门负责人姓名列表 JSON数组',
    
    -- 指派后的责任人和监督人
    responsible_ids TEXT COMMENT '责任人ID列表 JSON数组',
    responsible_name VARCHAR(200) COMMENT '责任人姓名',
    supervisor_id INT COMMENT '监督/确认人ID',
    supervisor_name VARCHAR(100) COMMENT '监督/确认人姓名',
    
    -- PDCA 各阶段内容
    root_cause TEXT COMMENT '根本原因分析 (Plan)',
    corrective_action TEXT COMMENT '纠正措施计划 (Plan)',
    implementation TEXT COMMENT '实施过程记录 (Do)',
    verification_result TEXT COMMENT '验证结果 (Check)',
    standardization TEXT COMMENT '标准化措施 (Act)',
    cause_type TEXT COMMENT '原因类型 JSON数组：设计考虑不周/培训不足/人员能力不足/流程不全',
    
    -- PDCA 各阶段附件
    plan_files TEXT COMMENT 'Plan阶段附件 JSON数组',
    implementation_files TEXT COMMENT 'Do阶段附件 JSON数组',
    check_files TEXT COMMENT 'Check阶段附件 JSON数组',
    act_files TEXT COMMENT 'Act阶段附件 JSON数组',
    description_files TEXT COMMENT '问题描述附件 JSON数组',
    
    -- 状态和工作流
    status VARCHAR(20) DEFAULT 'ASSIGN' COMMENT '状态：ASSIGN/PLAN/DO/CHECK/ACT/CLOSED',
    current_handler_id INT COMMENT '当前处理人ID',
    current_handler_name VARCHAR(100) COMMENT '当前处理人姓名',
    next_handler_id INT COMMENT '下一步处理人ID',
    next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名',
    
    -- 报告人
    reporter_id INT COMMENT '报告人ID',
    reporter_name VARCHAR(100) COMMENT '报告人姓名',
    
    -- 时间节点
    due_date DATE COMMENT '截止日期',
    plan_filled_by INT COMMENT 'Plan填写人',
    plan_filled_at TIMESTAMP COMMENT 'Plan填写时间',
    do_filled_by INT COMMENT 'Do填写人',
    do_filled_at TIMESTAMP COMMENT 'Do填写时间',
    verified_by INT COMMENT '验证人',
    verified_at TIMESTAMP COMMENT '验证时间',
    closed_by INT COMMENT '关闭人',
    closed_at TIMESTAMP COMMENT '关闭时间',
    
    -- 其他
    notify_users TEXT COMMENT '通知用户ID列表 JSON',
    is_changed TINYINT DEFAULT 0 COMMENT '是否由变更产生：0否 1是',
    change_source_id INT COMMENT '变更来源事件ID',
    change_source_no VARCHAR(50) COMMENT '变更来源事件编号',
    last_reminder_at TIMESTAMP COMMENT '最后提醒时间',
    last_overdue_reminder_at TIMESTAMP COMMENT '最后超期提醒时间',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间'
) COMMENT='质量事件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. 质量事件评论表
-- ============================================
DROP TABLE IF EXISTS quality_event_comment;
CREATE TABLE quality_event_comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '事件ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_name VARCHAR(100) COMMENT '用户名',
    content TEXT NOT NULL COMMENT '评论内容',
    attachments TEXT COMMENT '附件 JSON数组',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='质量事件评论表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. 质量事件操作日志表
-- ============================================
DROP TABLE IF EXISTS quality_event_log;
CREATE TABLE quality_event_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '事件ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_name VARCHAR(100) COMMENT '用户名',
    action VARCHAR(50) COMMENT '操作类型：CREATE/UPDATE/DELETE/ASSIGN/PLAN/DO/CHECK/ACT/CLOSED/UPDATE_DUE_DATE',
    old_value TEXT COMMENT '旧值',
    new_value TEXT COMMENT '新值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='质量事件操作日志表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. 程序文件表
-- ============================================
DROP TABLE IF EXISTS procedure_document;
CREATE TABLE procedure_document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_no VARCHAR(50) NOT NULL UNIQUE COMMENT '文件编号',
    doc_name VARCHAR(200) NOT NULL COMMENT '文件名称',
    category VARCHAR(50) COMMENT '分类：C-顾客相关/M-管理/S-支持',
    version VARCHAR(20) DEFAULT '1.0' COMMENT '版本号',
    author_id INT COMMENT '编写人ID',
    author_name VARCHAR(100) COMMENT '编写人姓名',
    reviewer_id INT COMMENT '审核人ID',
    reviewer_name VARCHAR(100) COMMENT '审核人姓名',
    approver_id INT COMMENT '批准人ID',
    approver_name VARCHAR(100) COMMENT '批准人姓名',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft/approved/obsoleted',
    effective_date DATE COMMENT '生效日期',
    obsolete_date DATE COMMENT '作废日期',
    file_url VARCHAR(500) COMMENT '文件URL',
    remarks TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
) COMMENT='程序文件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 程序文件附件表
-- ============================================
DROP TABLE IF EXISTS procedure_document_attachment;
CREATE TABLE procedure_document_attachment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_id INT NOT NULL COMMENT '程序文件ID',
    file_name VARCHAR(200) NOT NULL COMMENT '文件名称',
    file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
    file_type VARCHAR(50) COMMENT '文件类型',
    file_size INT COMMENT '文件大小',
    uploaded_by INT COMMENT '上传人ID',
    uploaded_by_name VARCHAR(100) COMMENT '上传人姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='程序文件附件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 部门表
-- ============================================
DROP TABLE IF EXISTS sys_department;
CREATE TABLE sys_department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) COMMENT '部门编码',
    parent_id INT DEFAULT 0 COMMENT '父部门ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='部门表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认部门
INSERT INTO sys_department (dept_name, dept_code, sort_order) VALUES
('品控中心', 'QC', 1),
('轨道技术研究院', 'RAIL_RESEARCH', 2),
('生产中心', 'PRODUCTION', 3),
('销售部', 'SALES', 4),
('技术支持中心', 'TECH_SUPPORT', 5),
('采购中心', 'PROCUREMENT', 6),
('财务部', 'FINANCE', 7),
('创新技术研究院', 'INNOVATION', 8),
('软件中心', 'SOFTWARE', 9),
('人力资源中心', 'HR', 10),
('综合行政部', 'ADMIN', 11),
('总经办', 'GM_OFFICE', 12),
('科技管理部', 'TECH_MGMT', 13)
ON DUPLICATE KEY UPDATE dept_name=VALUES(dept_name);

-- ============================================
-- 8. 项目表
-- ============================================
DROP TABLE IF EXISTS project;
CREATE TABLE project (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_no VARCHAR(100) NOT NULL UNIQUE COMMENT '项目编号',
    project_name VARCHAR(200) NOT NULL COMMENT '项目名称',
    customer VARCHAR(200) COMMENT '客户',
    product_type VARCHAR(50) COMMENT '产品类型',
    status VARCHAR(20) DEFAULT 'ongoing' COMMENT '状态：ongoing/completed/suspended',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    manager_id INT COMMENT '项目经理ID',
    manager_name VARCHAR(100) COMMENT '项目经理姓名',
    remarks TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
) COMMENT='项目表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. 指标表
-- ============================================
DROP TABLE IF EXISTS indicator;
CREATE TABLE indicator (
    id INT AUTO_INCREMENT PRIMARY KEY,
    indicator_no VARCHAR(50) NOT NULL UNIQUE COMMENT '指标编号',
    indicator_name VARCHAR(200) NOT NULL COMMENT '指标名称',
    category VARCHAR(50) COMMENT '分类',
    unit VARCHAR(50) COMMENT '单位',
    target_value DECIMAL(10,2) COMMENT '目标值',
    actual_value DECIMAL(10,2) COMMENT '实际值',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态',
    responsible_dept VARCHAR(100) COMMENT '责任部门',
    responsible_person_id INT COMMENT '责任人ID',
    responsible_person_name VARCHAR(100) COMMENT '责任人姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
) COMMENT='指标表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. 操作日志表
-- ============================================
DROP TABLE IF EXISTS sys_operation_log;
CREATE TABLE sys_operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(100) COMMENT '模块名称',
    action_type VARCHAR(50) COMMENT '操作类型：CREATE/UPDATE/DELETE/LOGIN/LOGOUT等',
    description TEXT COMMENT '操作描述',
    user_id INT COMMENT '用户ID',
    user_name VARCHAR(100) COMMENT '用户名',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    request_data TEXT COMMENT '请求数据',
    response_data TEXT COMMENT '响应数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='操作日志表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 初始化完成
-- ============================================
SELECT 'Database initialization completed successfully!' as result;
