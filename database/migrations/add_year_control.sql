-- 年份控制功能升级脚本
-- 执行时间: 2025-02-27

USE pis_system;

-- 1. 程序文件表增加年份字段
ALTER TABLE procedure_file 
ADD COLUMN year INT DEFAULT YEAR(CURRENT_DATE) COMMENT '所属年度' AFTER version,
ADD INDEX idx_year (year);

-- 2. 记录表增加年份字段
ALTER TABLE procedure_file_record 
ADD COLUMN year INT DEFAULT YEAR(CURRENT_DATE) COMMENT '所属年度' AFTER status,
ADD INDEX idx_year (year),
ADD INDEX idx_procedure_year (procedure_file_id, year);

-- 3. 更新现有数据年份为当前年度
UPDATE procedure_file SET year = YEAR(CURRENT_DATE) WHERE year IS NULL;
UPDATE procedure_file_record SET year = YEAR(CURRENT_DATE) WHERE year IS NULL;

-- 4. 用户偏好表（保存用户的年度选择）
CREATE TABLE IF NOT EXISTS user_preference (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    preference_key VARCHAR(50) NOT NULL COMMENT '偏好键',
    preference_value VARCHAR(200) COMMENT '偏好值',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_pref (user_id, preference_key),
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT='用户偏好设置表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 文件归档记录表
CREATE TABLE IF NOT EXISTS file_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL COMMENT '归档年度',
    archive_path VARCHAR(500) NOT NULL COMMENT '归档路径',
    file_count INT DEFAULT 0 COMMENT '归档文件数量',
    archive_by INT COMMENT '归档人',
    archive_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'COMPLETED' COMMENT '状态',
    remark TEXT COMMENT '备注',
    FOREIGN KEY (archive_by) REFERENCES sys_user(id)
) COMMENT='文件归档记录表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 跨年编辑标记表（特殊文件处理）
CREATE TABLE IF NOT EXISTS cross_year_file (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procedure_file_id INT NOT NULL COMMENT '程序文件ID',
    start_year INT NOT NULL COMMENT '开始年度',
    end_year INT COMMENT '结束年度（NULL表示持续中）',
    remark TEXT COMMENT '跨年说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (procedure_file_id) REFERENCES procedure_file(id) ON DELETE CASCADE,
    UNIQUE KEY uk_file_year (procedure_file_id, start_year)
) COMMENT='跨年编辑文件标记表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 修改文件编号为动态年份格式（示例更新）
-- 注意：这里只是添加字段，具体编号更新需要应用程序处理
-- 文件编号格式：QMS-CX01-YYYY（后四位为年份）

-- 8. 年度统计视图
CREATE OR REPLACE VIEW v_annual_statistics AS
SELECT 
    year,
    category,
    COUNT(*) as file_count,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN is_ko = 1 THEN 1 ELSE 0 END) as ko_count
FROM procedure_file
WHERE year IS NOT NULL
GROUP BY year, category;

-- 9. 年度记录完成率视图
CREATE OR REPLACE VIEW v_annual_completion_rate AS
SELECT 
    r.year,
    p.category,
    COUNT(*) as total_records,
    SUM(CASE WHEN r.status = 'UPLOADED' THEN 1 ELSE 0 END) as completed_records,
    ROUND(SUM(CASE WHEN r.status = 'UPLOADED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM procedure_file_record r
JOIN procedure_file p ON r.procedure_file_id = p.id
WHERE r.year IS NOT NULL
GROUP BY r.year, p.category;

-- 10. 插入默认年度数据（如果需要初始化）
-- INSERT INTO user_preference (user_id, preference_key, preference_value) 
-- SELECT id, 'current_year', YEAR(CURRENT_DATE) FROM sys_user WHERE status = 1;