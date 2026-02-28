-- ============================================
-- 操作记录表（审计日志）
-- ============================================

CREATE TABLE IF NOT EXISTS sys_operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT '操作用户ID',
    username VARCHAR(50) COMMENT '操作用户名',
    user_name VARCHAR(100) COMMENT '操作用户姓名',
    module VARCHAR(50) COMMENT '操作模块',
    action VARCHAR(50) COMMENT '操作类型：CREATE/UPDATE/DELETE/LOGIN/LOGOUT',
    description TEXT COMMENT '操作描述',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent TEXT COMMENT '浏览器信息',
    request_data TEXT COMMENT '请求数据（JSON）',
    response_data TEXT COMMENT '响应数据（JSON）',
    status TINYINT DEFAULT 1 COMMENT '状态：1成功 0失败',
    error_msg TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='操作记录表';

CREATE INDEX idx_operation_log_user ON sys_operation_log(user_id);
CREATE INDEX idx_operation_log_module ON sys_operation_log(module);
CREATE INDEX idx_operation_log_action ON sys_operation_log(action);
CREATE INDEX idx_operation_log_time ON sys_operation_log(created_at);
