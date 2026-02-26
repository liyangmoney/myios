-- ============================================
-- 42个ISO 22163体系文件数据 (中文版本)
-- 文件类别: C-程序文件, M-管理文件, S-支持文件
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE pis_system;

-- 删除旧表（如果存在）- 注意顺序：先删除有外键依赖的子表
DROP TABLE IF EXISTS pis_procedure_document;
DROP TABLE IF EXISTS pis_document_category;

-- 创建文件分类表
CREATE TABLE pis_document_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE COMMENT '分类代码: C/M/S',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='文件分类表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入文件分类
INSERT INTO pis_document_category (code, name, description, sort_order) VALUES
('C', '程序文件', 'Procedure', 1),
('M', '管理文件', 'Management', 2),
('S', '支持文件', 'Support', 3);

-- 创建42个体系文件表
CREATE TABLE pis_procedure_document (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_code) REFERENCES pis_document_category(code) ON DELETE SET NULL,
    FOREIGN KEY (upload_user_id) REFERENCES sys_user(id)
) COMMENT='42个体系文件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入42个体系文件 (中文名称)
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
('QMS-CX59-2025', '质量异常处理作业指导书', 'S', '品控中心', '2025', 'ACTIVE', 'P1', 310);
