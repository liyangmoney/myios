-- ============================================
-- 42个ISO 22163体系文件数据
-- 文件类别: C-程序文件, M-管理文件, S-支持文件
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE pis_system;

-- 创建文件分类表
CREATE TABLE IF NOT EXISTS pis_document_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE COMMENT '分类代码: C/M/S',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='文件分类表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入文件分类
INSERT INTO pis_document_category (code, name, description, sort_order) VALUES
('C', 'C-Procedure', 'C', 1),
('M', 'M-Management', 'M', 2),
('S', 'S-Support', 'S', 3);

-- 创建42个体系文件表
CREATE TABLE IF NOT EXISTS pis_procedure_document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'File No.',
    document_name VARCHAR(500) NOT NULL COMMENT 'File Name',
    category_code VARCHAR(10) COMMENT 'Category C/M/S',
    department VARCHAR(200) COMMENT 'Department',
    version VARCHAR(10) DEFAULT '2025' COMMENT 'Version',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'Status',
    priority VARCHAR(10) COMMENT 'Priority P0/P1/P2',
    sort_number INT COMMENT 'Sort Order',
    file_path VARCHAR(500) COMMENT 'File Path',
    upload_user_id INT COMMENT 'Uploader',
    upload_time TIMESTAMP COMMENT 'Upload Time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_code) REFERENCES pis_document_category(code),
    FOREIGN KEY (upload_user_id) REFERENCES sys_user(id)
) COMMENT='42 Procedure Documents' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 42 documents (using ASCII names to avoid encoding issues)
INSERT INTO pis_procedure_document (document_code, document_name, category_code, department, version, status, priority, sort_number) VALUES
-- C: Procedures (17)
('QMS-CX01-2025', 'HR Management Procedure', 'C', 'HR Dept', '2025', 'ACTIVE', 'P1', 101),
('QMS-CX02-2025', 'Training Management Procedure', 'C', 'HR Dept', '2025', 'ACTIVE', 'P1', 102),
('QMS-CX03-2025', 'Document Control Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P1', 103),
('QMS-CX04-2025', 'Record Control Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P1', 104),
('QMS-CX05-2025', 'Management Review Procedure', 'C', 'Office', '2025', 'ACTIVE', 'P1', 105),
('QMS-CX06-2025', 'Internal Audit Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P1', 106),
('QMS-CX07-2025', 'Corrective and Preventive Action Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P1', 107),
('QMS-CX08-2025', 'Continuous Improvement Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P1', 108),
('QMS-CX09-2025', 'RAM Management Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P0', 109),
('QMS-CX11-2025', 'Bid Management Procedure', 'C', 'Sales Dept', '2025', 'ACTIVE', 'P0', 111),
('QMS-CX12-2025', 'After-sales Service Procedure', 'C', 'Sales Dept', '2025', 'ACTIVE', 'P1', 112),
('QMS-CX14-2025', 'Business Plan Management Procedure', 'C', 'Office', '2025', 'ACTIVE', 'P0', 114),
('QMS-CX17-2025', 'Project Management Procedure', 'C', 'R&D Institute', '2025', 'ACTIVE', 'P0', 117),
('QMS-CX18-2025', 'EPPPS Control Procedure', 'C', 'Procurement', '2025', 'ACTIVE', 'P0', 118),
('QMS-CX20-2025', 'Hardware Design and Development Control Procedure', 'C', 'R&D Institute', '2025', 'ACTIVE', 'P0', 120),
('QMS-CX21-2025', 'Software Design and Development Control Procedure', 'C', 'R&D Institute', '2025', 'ACTIVE', 'P1', 121),
('QMS-CX23-2025', 'Nonconforming Output Control Procedure', 'C', 'Quality Center', '2025', 'ACTIVE', 'P0', 123),

-- M: Management (15)
('QMS-CX25-2025', 'Project Configuration Management Procedure', 'M', 'R&D Institute', '2025', 'ACTIVE', 'P1', 201),
('QMS-CX29-2025', 'Project Aging Management Procedure', 'M', 'R&D Institute', '2025', 'ACTIVE', 'P1', 202),
('QMS-CX30-2025', 'Change Management Procedure', 'M', 'R&D Institute', '2025', 'ACTIVE', 'P0', 203),
('QMS-CX33-2025', 'FAI First Article Inspection Procedure', 'M', 'Procurement', '2025', 'ACTIVE', 'P0', 204),
('QMS-CX36-2025', 'Employee Competency Matrix Procedure', 'M', 'HR Dept', '2025', 'ACTIVE', 'P1', 205),
('QMS-CX40-2025', 'Process Design Control Procedure', 'M', 'R&D Institute', '2025', 'ACTIVE', 'P1', 206),
('QMS-CX41-2025', 'Equipment and Tooling Management Procedure', 'M', 'Equipment Dept', '2025', 'ACTIVE', 'P1', 207),
('QMS-CX42-2025', 'Measuring Equipment Management Procedure', 'M', 'Quality Center', '2025', 'ACTIVE', 'P1', 208),
('QMS-CX43-2025', 'Knowledge Management Procedure', 'M', 'Office', '2025', 'ACTIVE', 'P2', 209),
('QMS-CX44-2025', 'Innovation Management Procedure', 'M', 'R&D Institute', '2025', 'ACTIVE', 'P2', 210),
('QMS-CX45-2025', 'Cost Management Procedure', 'M', 'Finance Dept', '2025', 'ACTIVE', 'P1', 211),
('QMS-CX46-2025', 'Risk and Opportunity Management Procedure', 'M', 'Quality Center', '2025', 'ACTIVE', 'P1', 212),
('QMS-CX47-2025', 'Stakeholder Management Procedure', 'M', 'Office', '2025', 'ACTIVE', 'P1', 213),
('QMS-CX48-2025', 'Performance Management Procedure', 'M', 'HR Dept', '2025', 'ACTIVE', 'P1', 214),
('QMS-CX49-2025', 'Information Security Management Procedure', 'M', 'IT Dept', '2025', 'ACTIVE', 'P1', 215),

-- S: Support (10)
('QMS-CX50-2025', 'Product Design Work Instruction', 'S', 'R&D Institute', '2025', 'ACTIVE', 'P1', 301),
('QMS-CX51-2025', 'Production Process Work Instruction', 'S', 'Production Dept', '2025', 'ACTIVE', 'P1', 302),
('QMS-CX52-2025', 'Inspection Work Instruction', 'S', 'Quality Center', '2025', 'ACTIVE', 'P1', 303),
('QMS-CX53-2025', 'Equipment Operation Work Instruction', 'S', 'Equipment Dept', '2025', 'ACTIVE', 'P1', 304),
('QMS-CX54-2025', 'Incoming Inspection Work Instruction', 'S', 'Quality Center', '2025', 'ACTIVE', 'P1', 305),
('QMS-CX55-2025', 'Outgoing Inspection Work Instruction', 'S', 'Quality Center', '2025', 'ACTIVE', 'P1', 306),
('QMS-CX56-2025', 'Warehouse Management Work Instruction', 'S', 'Logistics Dept', '2025', 'ACTIVE', 'P1', 307),
('QMS-CX57-2025', 'Packaging Work Instruction', 'S', 'Production Dept', '2025', 'ACTIVE', 'P2', 308),
('QMS-CX58-2025', 'Equipment Maintenance Work Instruction', 'S', 'Equipment Dept', '2025', 'ACTIVE', 'P1', 309),
('QMS-CX59-2025', 'Quality Exception Handling Work Instruction', 'S', 'Quality Center', '2025', 'ACTIVE', 'P1', 310);
