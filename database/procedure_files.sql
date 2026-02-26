-- ============================================
-- 程序文件管理模块数据库
-- 文件类别: C-程序文件, M-管理文件, S-支持文件
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE pis_system;

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS procedure_file_record;
DROP TABLE IF EXISTS procedure_file_person;
DROP TABLE IF EXISTS procedure_file;

-- 创建程序文件表
CREATE TABLE procedure_file (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_code VARCHAR(50) NOT NULL UNIQUE COMMENT '文件编号',
    file_name VARCHAR(200) NOT NULL COMMENT '文件名称',
    category VARCHAR(10) COMMENT '分类 C/M/S',
    department VARCHAR(100) COMMENT '编制部门',
    responsible_person VARCHAR(100) COMMENT '负责人',
    reviewer VARCHAR(100) COMMENT '审核人',
    approver VARCHAR(100) COMMENT '批准人',
    version VARCHAR(10) DEFAULT '2025' COMMENT '版本号',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态',
    priority VARCHAR(10) COMMENT '优先级 P0/P1/P2',
    description TEXT COMMENT '文件说明',
    file_path VARCHAR(500) COMMENT '文件路径',
    created_by INT COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES sys_user(id)
) COMMENT='程序文件表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建程序文件人员表（多个人员）
CREATE TABLE procedure_file_person (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procedure_file_id INT NOT NULL COMMENT '程序文件ID',
    person_name VARCHAR(100) COMMENT '人员姓名',
    person_role VARCHAR(50) COMMENT '角色：编制/审核/批准/执行',
    department VARCHAR(100) COMMENT '所属部门',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (procedure_file_id) REFERENCES procedure_file(id) ON DELETE CASCADE
) COMMENT='程序文件人员表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建程序文件记录表（需要编制的记录）
CREATE TABLE procedure_file_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procedure_file_id INT NOT NULL COMMENT '程序文件ID',
    record_name VARCHAR(200) COMMENT '记录名称',
    record_code VARCHAR(50) COMMENT '记录编号',
    description TEXT COMMENT '记录说明',
    file_path VARCHAR(500) COMMENT '上传的文件路径',
    uploaded_by INT COMMENT '上传人',
    uploaded_at TIMESTAMP COMMENT '上传时间',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态：待上传/已上传',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (procedure_file_id) REFERENCES procedure_file(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES sys_user(id)
) COMMENT='程序文件记录表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入42个程序文件
INSERT INTO procedure_file (file_code, file_name, category, department, responsible_person, version, status, priority) VALUES
-- C类: 程序文件 (17个)
('QMS-CX01-2025', '人力资源管理程序', 'C', '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX02-2025', '培训管理程序', 'C', '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX03-2025', '文件控制程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX04-2025', '记录控制程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX05-2025', '管理评审程序', 'C', '公司办公室', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX06-2025', '内部审核程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX07-2025', '纠正措施和预防措施管理程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX08-2025', '持续改进管理程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX09-2025', 'RAM管理程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P0'),
('QMS-CX11-2025', '投标管理程序', 'C', '销售部', '张敏琪', '2025', 'ACTIVE', 'P0'),
('QMS-CX12-2025', '售后服务管理程序', 'C', '销售部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX14-2025', '经营计划管理程序', 'C', '公司办公室', '张敏琪', '2025', 'ACTIVE', 'P0'),
('QMS-CX17-2025', '项目管理程序', 'C', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P0'),
('QMS-CX18-2025', 'EPPPS控制程序', 'C', '采购中心', '张敏琪', '2025', 'ACTIVE', 'P0'),
('QMS-CX20-2025', '产品硬件设计开发控制程序', 'C', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P0'),
('QMS-CX21-2025', '产品软件设计开发控制程序', 'C', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX23-2025', '不合格输出控制程序', 'C', '品控中心', '陈怡', '2025', 'ACTIVE', 'P0'),

-- M类: 管理文件 (15个)
('QMS-CX25-2025', '项目配置管理程序', 'M', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX29-2025', '项目老化管理程序', 'M', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX30-2025', '变更管理程序', 'M', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P0'),
('QMS-CX33-2025', 'FAI首件鉴定管理程序', 'M', '采购中心', '张敏琪', '2025', 'ACTIVE', 'P0'),
('QMS-CX36-2025', '员工能力矩阵管理程序', 'M', '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX40-2025', '工艺设计控制程序', 'M', '轨道技术研究院', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX41-2025', '设备和工装管理程序', 'M', '设备部', '戴娜', '2025', 'ACTIVE', 'P1'),
('QMS-CX42-2025', '测量设备管理程序', 'M', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX43-2025', '知识管理程序', 'M', '公司办公室', '张敏琪', '2025', 'ACTIVE', 'P2'),
('QMS-CX44-2025', '创新管理程序', 'M', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P2'),
('QMS-CX45-2025', '成本管理程序', 'M', '财务部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX46-2025', '风险和机遇管理程序', 'M', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX47-2025', '相关方管理程序', 'M', '公司办公室', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX48-2025', '绩效管理程序', 'M', '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX49-2025', '信息安全管理程序', 'M', 'IT部', '张敏琪', '2025', 'ACTIVE', 'P1'),

-- S类: 支持文件 (10个)
('QMS-CX50-2025', '产品设计作业指导书', 'S', '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX51-2025', '生产工艺作业指导书', 'S', '生产部', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX52-2025', '检验作业指导书', 'S', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX53-2025', '设备操作作业指导书', 'S', '设备部', '戴娜', '2025', 'ACTIVE', 'P1'),
('QMS-CX54-2025', '来料检验作业指导书', 'S', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX55-2025', '出货检验作业指导书', 'S', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX56-2025', '仓库管理作业指导书', 'S', '物流部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX57-2025', '包装作业指导书', 'S', '生产部', '毛博士', '2025', 'ACTIVE', 'P2'),
('QMS-CX58-2025', '设备维护保养作业指导书', 'S', '设备部', '戴娜', '2025', 'ACTIVE', 'P1'),
('QMS-CX59-2025', '质量异常处理作业指导书', 'S', '品控中心', '陈怡', '2025', 'ACTIVE', 'P1');

-- 为每个程序文件插入相关人员
INSERT INTO procedure_file_person (procedure_file_id, person_name, person_role, department) 
SELECT id, responsible_person, '编制', department FROM procedure_file;

-- 为关键文件插入需要编制的记录示例
INSERT INTO procedure_file_record (procedure_file_id, record_name, record_code, description, status) VALUES
(1, '人员培训记录表', 'QMS-JL01', '记录员工培训情况', 'PENDING'),
(1, '培训计划表', 'QMS-JL02', '年度培训计划', 'PENDING'),
(9, 'RAM分析报告', 'QMS-JL09', '可靠性可用性可维护性分析', 'PENDING'),
(9, '危害日志', 'QMS-JL10', '记录识别的危害', 'PENDING'),
(11, '投标记录表', 'QMS-JL11', '记录投标过程', 'PENDING'),
(14, '经营计划', 'QMS-JL14', '年度经营计划', 'PENDING'),
(17, '项目计划书', 'QMS-JL17', '项目启动计划', 'PENDING'),
(17, 'D1-D8阶段评审记录', 'QMS-JL18', '项目各阶段评审', 'PENDING'),
(18, '供应商评估表', 'QMS-JL18', '供应商准入评估', 'PENDING'),
(20, '设计评审记录', 'QMS-JL20', '硬件设计评审', 'PENDING'),
(20, '设计变更记录', 'QMS-JL21', 'ECR/ECN记录', 'PENDING'),
(23, '不合格品处理单', 'QMS-JL23', 'NCR处理记录', 'PENDING'),
(25, '配置管理计划', 'QMS-JL25', '项目配置管理', 'PENDING'),
(27, '变更申请单', 'QMS-JL27', '变更申请记录', 'PENDING'),
(28, 'FAI报告', 'QMS-JL28', '首件鉴定报告', 'PENDING');
