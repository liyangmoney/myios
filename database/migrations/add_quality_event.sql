-- ============================================
-- 质量事件监管表（基于 PDCA）
-- ============================================

-- 质量事件表
CREATE TABLE IF NOT EXISTS quality_event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_no VARCHAR(50) NOT NULL UNIQUE COMMENT '事件编号，如 QE-2025-001',
    title VARCHAR(200) NOT NULL COMMENT '事件标题',
    description TEXT COMMENT '问题描述（P-Plan）',
    
    -- 分类信息
    event_type VARCHAR(50) COMMENT '事件类型：内部不符合/外部不符合/审核发现/过程异常/设备异常/其他',
    severity VARCHAR(20) COMMENT '严重程度：轻微/一般/严重/致命',
    
    -- PDCA 各阶段内容
    root_cause TEXT COMMENT '根本原因分析（P-Plan）',
    corrective_action TEXT COMMENT '纠正措施计划（P-Plan）',
    
    implementation TEXT COMMENT '实施过程记录（D-Do）',
    implementation_files TEXT COMMENT '实施附件（JSON数组）',
    
    verification_result TEXT COMMENT '验证结果（C-Check）',
    verified_by INT COMMENT '验证人ID',
    verified_at TIMESTAMP NULL COMMENT '验证时间',
    
    standardization TEXT COMMENT '标准化措施（A-Act）',
    closed_by INT COMMENT '关闭人ID',
    closed_at TIMESTAMP NULL COMMENT '关闭时间',
    
    -- 责任信息
    reporter_id INT NOT NULL COMMENT '创建人ID',
    reporter_name VARCHAR(100) COMMENT '创建人姓名',
    responsible_id INT COMMENT '责任人ID',
    responsible_name VARCHAR(100) COMMENT '责任人姓名',
    
    -- 当前处理人（用于流程跟踪）
    current_handler_id INT COMMENT '当前处理人ID',
    current_handler_name VARCHAR(100) COMMENT '当前处理人姓名',
    
    -- 下一步指定
    next_handler_id INT COMMENT '下一步处理人ID',
    next_handler_name VARCHAR(100) COMMENT '下一步处理人姓名',
    next_step VARCHAR(50) COMMENT '下一步操作：PLAN/DO/CHECK/ACT',
    
    -- 通知人（JSON数组存储用户ID列表）
    notify_users TEXT COMMENT '通知人列表（JSON）',
    
    -- 状态和时间
    status VARCHAR(20) DEFAULT 'NEW' COMMENT '状态：NEW新建/PLAN计划中/DO执行中/CHECK验证中/CLOSED已关闭/REJECTED已驳回',
    due_date DATE COMMENT '计划完成日期',
    last_reminder_at TIMESTAMP NULL COMMENT '最后提醒时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '软删除时间',
    
    FOREIGN KEY (reporter_id) REFERENCES sys_user(id),
    FOREIGN KEY (responsible_id) REFERENCES sys_user(id),
    FOREIGN KEY (current_handler_id) REFERENCES sys_user(id),
    FOREIGN KEY (next_handler_id) REFERENCES sys_user(id),
    FOREIGN KEY (verified_by) REFERENCES sys_user(id),
    FOREIGN KEY (closed_by) REFERENCES sys_user(id)
) COMMENT='质量事件表';

-- 质量事件评论/更新记录表
CREATE TABLE IF NOT EXISTS quality_event_comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '关联事件ID',
    user_id INT NOT NULL COMMENT '评论人ID',
    user_name VARCHAR(100) COMMENT '评论人姓名',
    content TEXT COMMENT '评论内容',
    attachments TEXT COMMENT '附件（JSON数组）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES quality_event(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT='质量事件评论记录表';

-- 质量事件操作日志表
CREATE TABLE IF NOT EXISTS quality_event_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT '关联事件ID',
    user_id INT NOT NULL COMMENT '操作人ID',
    user_name VARCHAR(100) COMMENT '操作人姓名',
    action VARCHAR(50) COMMENT '操作类型：CREATE/UPDATE/DELETE/STATUS_CHANGE/COMMENT',
    old_value TEXT COMMENT '旧值',
    new_value TEXT COMMENT '新值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES quality_event(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT='质量事件操作日志表';

-- 索引（如果不存在则创建）
CREATE INDEX IF NOT EXISTS idx_quality_event_status ON quality_event(status);
CREATE INDEX IF NOT EXISTS idx_quality_event_reporter ON quality_event(reporter_id);
CREATE INDEX IF NOT EXISTS idx_quality_event_responsible ON quality_event(responsible_id);
CREATE INDEX IF NOT EXISTS idx_quality_event_severity ON quality_event(severity);
CREATE INDEX IF NOT EXISTS idx_quality_event_created ON quality_event(created_at);
