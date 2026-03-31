-- 用户表添加部门领导相关字段
ALTER TABLE sys_user 
ADD COLUMN is_dept_leader TINYINT DEFAULT 0 COMMENT '是否部门领导：1是 0否',
ADD COLUMN job_title VARCHAR(100) COMMENT '职称（部门领导时必填）';
