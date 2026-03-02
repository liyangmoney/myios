-- ============================================
-- PIS绩效指标管理系统 - 完整数据库脚本
-- MySQL 8.0+
-- 包含所有最新表结构：项目管理、质量事件、程序文件、PDCA等
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS pis_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pis_system;

-- ============================================
-- 1. 部门表
-- ============================================
CREATE TABLE IF NOT EXISTS sys_department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) COMMENT '部门编码',
    parent_id INT DEFAULT 0 COMMENT '父部门ID，0为顶级部门',
    sort_order INT DEFAULT 0 COMMENT '排序号',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='部门表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sys_department (dept_name, dept_code, parent_id, sort_order) VALUES
('销售部', 'SALES', 0, 1),
('研发部', 'R&D', 0, 2),
('质量部', 'QUALITY', 0, 3),
('人力资源部', 'HR', 0, 4),
('采购部', 'PROCUREMENT', 0, 5),
('生产部', 'PRODUCTION', 0, 6),
('财务部', 'FINANCE', 0, 7),
('行政部', 'ADMIN', 0, 8)
ON DUPLICATE KEY UPDATE dept_name=VALUES(dept_name);

-- ============================================
-- 2. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS sys_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    user_name VARCHAR(200) COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    department VARCHAR(100) COMMENT '所属部门',
    role VARCHAR(50) DEFAULT 'user' COMMENT '角色：admin/user',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    remark TEXT COMMENT '备注',
    created_by INT COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间'
) COMMENT='用户表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123，使用 bcrypt 加密)
INSERT INTO sys_user (username, password, user_name, email, role, status) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin@example.com', 'admin', 1)
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- ============================================
-- 3. 操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS sys_operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(100) COMMENT '模块名称',
    action_type VARCHAR(50) COMMENT '操作类型：CREATE/UPDATE/DELETE/LOGIN/LOGOUT等',
    description TEXT COMMENT '操作描述',
    user_id INT COMMENT '操作用户ID',
    user_name VARCHAR(100) COMMENT '操作用户名',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url TEXT COMMENT '请求URL',
    request_params TEXT COMMENT '请求参数',
    response_data TEXT COMMENT '响应数据',
    execution_time INT COMMENT '执行时间(ms)',
    status TINYINT DEFAULT 1 COMMENT '状态：1成功 0失败',
    error_msg TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='操作日志表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. 程序文件分类表
-- ============================================
CREATE TABLE IF NOT EXISTS pis_document_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE COMMENT '分类代码: C/M/S',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='文件分类表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO pis_document_category (code, name, description, sort_order) VALUES
('C', '程序文件', 'Procedure', 1),
('M', '管理文件', 'Management', 2),
('S', '支持文件', 'Support', 3)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- 5. 程序文件表 (42个ISO 22163体系文件)
-- ============================================
CREATE TABLE IF NOT EXISTS pis_procedure_document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_code VARCHAR(50) NOT NULL UNIQUE COMMENT '文件编号',
    document_name VARCHAR(500) NOT NULL COMMENT '文件名称',
    category_code VARCHAR(10) COMMENT '分类代码 C/M/S',
    department VARCHAR(200) COMMENT '主责部门',
    version VARCHAR(10) DEFAULT '2025' COMMENT '版本号',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态',
    priority VARCHAR(10) COMMENT '优先级 P0/P1/P2',
    sort_number INT COMMENT '排序号',
    file_path VARCHAR(500) COMMENT '文件路径',
    upload_user_id INT COMMENT '上传人',
    upload_time TIMESTAMP COMMENT '上传时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='42个体系文件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 程序文件人员分配表
-- ============================================
CREATE TABLE IF NOT EXISTS pis_procedure_person (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL COMMENT '程序文件ID',
    user_id INT NOT NULL COMMENT '用户ID',
    role_type VARCHAR(50) COMMENT '角色：编写人/审核人/批准人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES pis_procedure_document(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
    UNIQUE KEY uk_doc_user (document_id, user_id, role_type)
) COMMENT='程序文件人员分配表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 程序文件记录表
-- ============================================
CREATE TABLE IF NOT EXISTS pis_procedure_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL COMMENT '程序文件ID',
    record_name VARCHAR(200) COMMENT '记录名称',
    record_code VARCHAR(100) COMMENT '记录编号',
    file_path VARCHAR(500) COMMENT '文件路径',
    file_name VARCHAR(200) COMMENT '原始文件名',
    file_size INT COMMENT '文件大小',
    uploaded_by INT COMMENT '上传人',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    year VARCHAR(4) DEFAULT '2025' COMMENT '年份',
    FOREIGN KEY (document_id) REFERENCES pis_procedure_document(id) ON DELETE CASCADE
) COMMENT='程序文件记录表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. 质量事件表 (PDCA)
-- ============================================
CREATE TABLE IF NOT EXISTS quality_event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_no VARCHAR(50) NOT NULL UNIQUE COMMENT '事件编号',
    title VARCHAR(500) NOT NULL COMMENT '事件标题',
    description TEXT COMMENT '事件描述',
    
    -- 事件类型和严重度
    event_type VARCHAR(50) COMMENT '事件类型：内部不符合/外部不符合/审核发现/过程异常/设备异常/其他',
    severity VARCHAR(20) COMMENT '严重度：轻微/一般/严重/致命',
    
    -- PDCA 各阶段内容
    root_cause TEXT COMMENT '根本原因分析 (Plan)',
    corrective_action TEXT COMMENT '纠正措施计划 (Plan)',
    implementation TEXT COMMENT '实施过程记录 (Do)',
    verification_result TEXT COMMENT '验证结果 (Check)',
    standardization TEXT COMMENT '标准化措施 (Act)',
    
    -- PDCA 各阶段附件
    plan_files TEXT COMMENT 'Plan阶段附件 JSON数组',
    implementation_files TEXT COMMENT 'Do阶段附件 JSON数组',
    check_files TEXT COMMENT 'Check阶段附件 JSON数组',
    act_files TEXT COMMENT 'Act阶段附件 JSON数组',
    
    -- 状态和工作流
    status VARCHAR(20) DEFAULT 'NEW' COMMENT '状态：NEW/PLAN/DO/CHECK/ACT/CLOSED',
    current_handler_id INT COMMENT '当前处理人ID',
    current_handler_name VARCHAR(100) COMMENT '当前处理人姓名',
    next_handler_id INT COMMENT '下一步处理人ID',
    next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名',
    next_step VARCHAR(20) COMMENT '下一步：PLAN/DO/CHECK/ACT',
    
    -- 责任人和报告人
    responsible_id INT COMMENT '责任人ID',
    responsible_name VARCHAR(100) COMMENT '责任人姓名',
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
    department VARCHAR(100) COMMENT '发生部门',
    notify_users TEXT COMMENT '通知用户ID列表 JSON',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间'
) COMMENT='质量事件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. 质量事件评论表
-- ============================================
CREATE TABLE IF NOT EXISTS quality_event_comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '事件ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_name VARCHAR(100) COMMENT '用户名',
    content TEXT NOT NULL COMMENT '评论内容',
    attachments TEXT COMMENT '附件 JSON数组',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES quality_event(id) ON DELETE CASCADE
) COMMENT='质量事件评论表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. 质量事件操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS quality_event_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '事件ID',
    user_id INT COMMENT '用户ID',
    user_name VARCHAR(100) COMMENT '用户名',
    action VARCHAR(50) COMMENT '操作：CREATE/UPDATE/DELETE/COMMENT',
    old_value TEXT COMMENT '旧值',
    new_value TEXT COMMENT '新值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES quality_event(id) ON DELETE CASCADE
) COMMENT='质量事件操作日志表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. 项目表 (保留，如需要可启用)
-- ============================================
CREATE TABLE IF NOT EXISTS pis_project (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE COMMENT '项目编号',
    project_name VARCHAR(200) NOT NULL COMMENT '项目名称',
    project_type VARCHAR(50) COMMENT '项目类型：ISO22163/ISO9001/EPPPS',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    responsible_user_id INT COMMENT '负责人ID',
    description TEXT COMMENT '项目描述',
    created_by INT COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='项目表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 插入42个程序文件数据
-- ============================================
INSERT INTO pis_procedure_document (document_code, document_name, category_code, department, version, status, priority, sort_number) VALUES
-- C类: 程序文件 (17个)
('QMS-CX01-2025', '人力资源管理程序', 'C', '人力资源部', '2025', 'ACTIVE', 'P1', 101),
('QMS-CX02-2025', '培训管理程序', 'C', '人力资源部', '2025', 'ACTIVE', 'P1', 102),
('QMS-CX03-2025', '文件控制程序', 'C', '品控中心', '2025', 'ACTIVE', 'P1', 103),
('QMS-CX04-2025', '记录控制程序', 'C', '品控中心', '2025', 'ACTIVE', 'P1', 104),
('QMS-CX05-2025', '管理评审程序', 'C', '公司办公室', '2025', 'ACTIVE', 'P1', 105),
('QMS-CX06-2025', '内部审核程序', 'C', '品控中心', '2025', 'ACTIVE', 'P1', 106),
('QMS-CX07-2025', '纠正措施和预防措施管理程序', 'C', '品控中心', '2025', 'ACTIVE', 'P1', 107),
('QMS-CX08-2025', '持续改进管理程序', 'C', '品控中心', '2025', 'ACTIVE', 'P1', 108),
('QMS-CX09-2025', 'RAM管理程序', 'C', '品控中心', '2025', 'ACTIVE', 'P0', 109),
('QMS-CX11-2025', '投标管理程序', 'C', '销售部', '2025', 'ACTIVE', 'P0', 111),
('QMS-CX12-2025', '售后服务管理程序', 'C', '销售部', '2025', 'ACTIVE', 'P1', 112),
('QMS-CX14-2025', '经营计划管理程序', 'C', '公司办公室', '2025', 'ACTIVE', 'P0', 114),
('QMS-CX17-2025', '项目管理程序', 'C', '轨道技术研究院', '2025', 'ACTIVE', 'P0', 117),
('QMS-CX18-2025', 'EPPPS控制程序', 'C', '采购中心', '2025', 'ACTIVE', 'P0', 118),
('QMS-CX20-2025', '产品硬件设计开发控制程序', 'C', '轨道技术研究院', '2025', 'ACTIVE', 'P0', 120),
('QMS-CX21-2025', '产品软件设计开发控制程序', 'C', '轨道技术研究院', '2025', 'ACTIVE', 'P1', 121),
('QMS-CX23-2025', '不合格输出控制程序', 'C', '品控中心', '2025', 'ACTIVE', 'P0', 123),

-- M类: 管理文件 (15个)
('QMS-CX25-2025', '项目配置管理程序', 'M', '轨道技术研究院', '2025', 'ACTIVE', 'P1', 201),
('QMS-CX29-2025', '项目老化管理程序', 'M', '轨道技术研究院', '2025', 'ACTIVE', 'P1', 202),
('QMS-CX30-2025', '变更管理程序', 'M', '轨道技术研究院', '2025', 'ACTIVE', 'P0', 203),
('QMS-CX33-2025', 'FAI首件鉴定管理程序', 'M', '采购中心', '2025', 'ACTIVE', 'P0', 204),
('QMS-CX36-2025', '员工能力矩阵管理程序', 'M', '人力资源部', '2025', 'ACTIVE', 'P1', 205),
('QMS-CX40-2025', '工艺设计控制程序', 'M', '轨道技术研究院', '2025', 'ACTIVE', 'P1', 206),
('QMS-CX41-2025', '设备和工装管理程序', 'M', '设备部', '2025', 'ACTIVE', 'P1', 207),
('QMS-CX42-2025', '测量设备管理程序', 'M', '品控中心', '2025', 'ACTIVE', 'P1', 208),
('QMS-CX43-2025', '知识管理程序', 'M', '公司办公室', '2025', 'ACTIVE', 'P2', 209),
('QMS-CX44-2025', '创新管理程序', 'M', '轨道技术研究院', '2025', 'ACTIVE', 'P2', 210),
('QMS-CX45-2025', '成本管理程序', 'M', '财务部', '2025', 'ACTIVE', 'P1', 211),
('QMS-CX46-2025', '风险和机遇管理程序', 'M', '品控中心', '2025', 'ACTIVE', 'P1', 212),
('QMS-CX47-2025', '相关方管理程序', 'M', '公司办公室', '2025', 'ACTIVE', 'P1', 213),
('QMS-CX48-2025', '绩效管理程序', 'M', '人力资源部', '2025', 'ACTIVE', 'P1', 214),
('QMS-CX49-2025', '信息安全管理程序', 'M', 'IT部', '2025', 'ACTIVE', 'P1', 215),

-- S类: 支持文件 (10个)
('QMS-CX50-2025', '产品设计作业指导书', 'S', '轨道技术研究院', '2025', 'ACTIVE', 'P1', 301),
('QMS-CX51-2025', '生产工艺作业指导书', 'S', '生产部', '2025', 'ACTIVE', 'P1', 302),
('QMS-CX52-2025', '检验作业指导书', 'S', '品控中心', '2025', 'ACTIVE', 'P1', 303),
('QMS-CX53-2025', '设备操作作业指导书', 'S', '设备部', '2025', 'ACTIVE', 'P1', 304),
('QMS-CX54-2025', '来料检验作业指导书', 'S', '品控中心', '2025', 'ACTIVE', 'P1', 305),
('QMS-CX55-2025', '出货检验作业指导书', 'S', '品控中心', '2025', 'ACTIVE', 'P1', 306),
('QMS-CX56-2025', '仓库管理作业指导书', 'S', '物流部', '2025', 'ACTIVE', 'P1', 307),
('QMS-CX57-2025', '包装作业指导书', 'S', '生产部', '2025', 'ACTIVE', 'P2', 308),
('QMS-CX58-2025', '设备维护保养作业指导书', 'S', '设备部', '2025', 'ACTIVE', 'P1', 309),
('QMS-CX59-2025', '质量异常处理作业指导书', 'S', '品控中心', '2025', 'ACTIVE', 'P1', 310)
ON DUPLICATE KEY UPDATE document_name=VALUES(document_name), department=VALUES(department);
