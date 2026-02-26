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
    group_sort VARCHAR(10) COMMENT '分组排序 C1,C2,C3,C4,C5,M1-M7,S1-S6',
    is_ko TINYINT(1) DEFAULT 0 COMMENT '是否KO项 0-否 1-是',
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

-- 插入42个程序文件（含KO项标记）
INSERT INTO procedure_file (file_code, file_name, category, group_sort, is_ko, department, responsible_person, version, status, priority) VALUES
('QMS-CX11-2025', '顾客满意度评价程序', 'C', 'C1', 0, '销售部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX15-2025', '协商和沟通控制程序', 'C', 'C1', 0, '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX20-2025', '产品和服务的要求管理程序', 'C', 'C1', 1, '销售部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX08-2025', '售中管理控制程序', 'C', 'C1', 0, '销售部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX17-2025', '产品硬件设计开发控制程序', 'C', 'C2', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX21-2025', '软件设计开发控制程序', 'C', 'C2', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX03-2025', 'RAMS管理程序', 'C', 'C2', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX19-2025', '创新管理程序', 'C', 'C2', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX14-2025', '产品工艺设计开发控制程序', 'C', 'C2', 0, '轨道技术研究院', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX12-2025', 'LCC管理程序', 'C', 'C3', 0, '财务部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX09-2025', '项目管理程序', 'C', 'C3', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX18-2025', '老化管理程序', 'C', 'C3', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX04-2025', '配置管理程序', 'C', 'C3', 1, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX05-2025', '变更管理程序', 'C', 'C3', 1, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX06-2025', '产品生产过程控制程序', 'C', 'C4', 1, '生产中心', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX01-2025', '关键特殊过程控制程序', 'C', 'C4', 1, '生产中心', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX23-2025', '售后活动管理程序', 'C', 'C4', 0, '销售部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX30-2025', '风险与机遇应对管理程序', 'M', 'M1', 1, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX31-2025', '经营计划管理程序', 'M', 'M1', 1, '总经理办公室', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX39-2025', '相关方需求控制程序', 'M', 'M1', 1, '公司办公室', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX22-2025', '过程评审控制程序', 'M', 'M1', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX35-2025', '业务连续性计划管理程序', 'M', 'M1', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX02-2025', '预算控制程序', 'M', 'M2', 0, '财务部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX34-2025', '不良质量成本管理办法', 'M', 'M2', 0, '财务部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX07-2025', '文件及记录控制程序', 'M', 'M3', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX40-2025', '预防和纠正措施控制程序', 'M', 'M4', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX36-2025', '数据分析控制程序', 'M', 'M5', 1, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX16-2025', '内部审核控制程序', 'M', 'M6', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX26-2025', '管理评审控制程序', 'M', 'M7', 0, '品控中心', '陈怡', '2025', 'ACTIVE', 'P1'),
('QMS-CX29-2025', '工艺设计控制程序', 'M', 'M8', 0, '轨道技术研究院', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX25-2025', '项目配置管理程序', 'M', 'M9', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX24-2025', '项目老化管理程序', 'M', 'M10', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX38-2025', '创新管理程序', 'M', 'M11', 0, '轨道技术研究院', '梁博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX33-2025', '投标管理程序', 'M', 'M12', 0, '销售部', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX13-2025', 'EPPPS控制程序', 'S', 'S1', 1, '采购中心', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX27-2025', '过程外包或转移策划程序', 'S', 'S1', 0, '采购中心', '张敏琪', '2025', 'ACTIVE', 'P1'),
('QMS-CX10-2025', '知识管理程序', 'S', 'S2', 0, '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX32-2025', '人力资源管理程序', 'S', 'S2', 0, '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX28-2025', '协商和沟通控制程序', 'S', 'S2', 0, '技术支持中心', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX41-2025', '员工能力管理程序', 'S', 'S2', 1, '人力资源部', '徐家璐', '2025', 'ACTIVE', 'P1'),
('QMS-CX37-2025', '基础设施控制程序', 'S', 'S3', 0, '生产中心', '毛博士', '2025', 'ACTIVE', 'P1'),
('QMS-CX42-2025', '贮存和库存控制程序', 'S', 'S3', 0, '采购中心', '张敏琪', '2025', 'ACTIVE', 'P1');

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
