-- Year Control Feature Migration Script
-- Execute Date: 2025-02-27

USE pis_system;

-- Set charset
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Add year column to procedure_file table
ALTER TABLE procedure_file 
ADD COLUMN year INT DEFAULT YEAR(CURRENT_DATE) COMMENT 'Belonging Year' AFTER version,
ADD INDEX idx_year (year);

-- 2. Add year column to procedure_file_record table
ALTER TABLE procedure_file_record 
ADD COLUMN year INT DEFAULT YEAR(CURRENT_DATE) COMMENT 'Belonging Year' AFTER status,
ADD INDEX idx_year (year),
ADD INDEX idx_procedure_year (procedure_file_id, year);

-- 3. Update existing data to current year
UPDATE procedure_file SET year = YEAR(CURRENT_DATE) WHERE year IS NULL;
UPDATE procedure_file_record SET year = YEAR(CURRENT_DATE) WHERE year IS NULL;

-- 4. User preference table
CREATE TABLE IF NOT EXISTS user_preference (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'User ID',
    preference_key VARCHAR(50) NOT NULL COMMENT 'Preference Key',
    preference_value VARCHAR(200) COMMENT 'Preference Value',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_pref (user_id, preference_key),
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT='User Preference Table' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. File archive record table
CREATE TABLE IF NOT EXISTS file_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL COMMENT 'Archive Year',
    archive_path VARCHAR(500) NOT NULL COMMENT 'Archive Path',
    file_count INT DEFAULT 0 COMMENT 'File Count',
    archive_by INT COMMENT 'Archived By',
    archive_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'COMPLETED' COMMENT 'Status',
    remark TEXT COMMENT 'Remark',
    FOREIGN KEY (archive_by) REFERENCES sys_user(id)
) COMMENT='File Archive Record Table' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Cross-year file mark table
CREATE TABLE IF NOT EXISTS cross_year_file (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procedure_file_id INT NOT NULL COMMENT 'Procedure File ID',
    start_year INT NOT NULL COMMENT 'Start Year',
    end_year INT COMMENT 'End Year (NULL means ongoing)',
    remark TEXT COMMENT 'Cross-year Remark',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (procedure_file_id) REFERENCES procedure_file(id) ON DELETE CASCADE,
    UNIQUE KEY uk_file_year (procedure_file_id, start_year)
) COMMENT='Cross-year File Mark Table' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Annual statistics view
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

-- 8. Annual completion rate view
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