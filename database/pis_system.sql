-- ============================================
-- PIS绩效指标管理系统数据库脚本
-- MySQL 8.0+
-- ============================================

CREATE DATABASE IF NOT EXISTS pis_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pis_system;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    user_name VARCHAR(100) COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    role VARCHAR(50) DEFAULT 'user' COMMENT '角色：admin/user',
    dept_id INT COMMENT '部门ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='用户表';

-- 2. 项目表
CREATE TABLE IF NOT EXISTS pis_project (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE COMMENT '项目编号',
    project_name VARCHAR(200) NOT NULL COMMENT '项目名称',
    project_type VARCHAR(50) COMMENT '项目类型：ISO22163/ISO9001/EPPPS',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态：进行中/已结束',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    responsible_user_id INT COMMENT '负责人ID',
    description TEXT COMMENT '项目描述',
    created_by INT COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsible_user_id) REFERENCES sys_user(id)
) COMMENT='项目表';

-- 3. 项目成员表
CREATE TABLE IF NOT EXISTS pis_project_member (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL COMMENT '项目ID',
    user_id INT NOT NULL COMMENT '用户ID',
    role VARCHAR(50) DEFAULT '成员' COMMENT '角色：负责人/成员',
    assigned_indicators TEXT COMMENT '分配的指标ID列表',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES pis_project(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT='项目成员表';

-- 4. 指标库表
CREATE TABLE IF NOT EXISTS pis_indicator (
    id INT AUTO_INCREMENT PRIMARY KEY,
    indicator_code VARCHAR(50) NOT NULL UNIQUE COMMENT '指标编码',
    indicator_name VARCHAR(200) NOT NULL COMMENT '指标名称',
    category VARCHAR(50) COMMENT '指标类别',
    unit VARCHAR(50) COMMENT '计量单位',
    weight DECIMAL(5,2) DEFAULT 0 COMMENT '权重(0-100)',
    target_type VARCHAR(20) COMMENT '目标类型：GE/LE/EQ/RANGE',
    target_value DECIMAL(15,4) COMMENT '目标值',
    target_min DECIMAL(15,4) COMMENT '目标范围-最小值',
    target_max DECIMAL(15,4) COMMENT '目标范围-最大值',
    calculation_formula TEXT COMMENT '计算公式',
    data_source VARCHAR(100) COMMENT '数据来源',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='指标库表';

-- 5. 项目指标实例表
CREATE TABLE IF NOT EXISTS pis_project_indicator (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL COMMENT '项目ID',
    indicator_id INT NOT NULL COMMENT '指标ID',
    weight DECIMAL(5,2) COMMENT '该项目中此指标的权重',
    target_value DECIMAL(15,4) COMMENT '该项目的目标值',
    actual_value DECIMAL(15,4) COMMENT '实际值',
    achievement_rate DECIMAL(5,2) COMMENT '达标率',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态：PENDING/REPORTED/APPROVED',
    responsible_user_id INT COMMENT '责任人',
    reporting_period VARCHAR(20) COMMENT '填报周期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES pis_project(id) ON DELETE CASCADE,
    FOREIGN KEY (indicator_id) REFERENCES pis_indicator(id)
) COMMENT='项目指标实例表';

-- 6. 指标填报记录表
CREATE TABLE IF NOT EXISTS pis_indicator_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_indicator_id INT NOT NULL COMMENT '项目指标ID',
    reporting_date DATE COMMENT '填报日期',
    actual_value DECIMAL(15,4) COMMENT '实际值',
    evidence_description TEXT COMMENT '证据说明',
    reporter_id INT COMMENT '填报人',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_indicator_id) REFERENCES pis_project_indicator(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES sys_user(id)
) COMMENT='指标填报记录表';

-- 7. 文档表
CREATE TABLE IF NOT EXISTS pis_document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT COMMENT '项目ID',
    record_id INT COMMENT '填报记录ID',
    doc_name VARCHAR(200) COMMENT '文档名称',
    file_path VARCHAR(500) COMMENT '文件路径',
    file_size INT COMMENT '文件大小',
    file_type VARCHAR(50) COMMENT '文件类型',
    uploaded_by INT COMMENT '上传人',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES pis_project(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES sys_user(id)
) COMMENT='文档表';

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO sys_user (username, password, user_name, email, role, status) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqWfW2z8wKJvUqYnTnZPHzZGA3r.W', '管理员', 'admin@example.com', 'admin', 1),
('zhangsan', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqWfW2z8wKJvUqYnTnZPHzZGA3r.W', '张三', 'zhangsan@example.com', 'user', 1),
('lisi', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqWfW2z8wKJvUqYnTnZPHzZGA3r.W', '李四', 'lisi@example.com', 'user', 1),
('wangwu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqWfW2z8wKJvUqYnTnZPHzZGA3r.W', '王五', 'wangwu@example.com', 'user', 1);
