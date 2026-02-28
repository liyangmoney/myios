-- 检查 admin 用户当前密码
SELECT username, password FROM sys_user WHERE username = 'admin';

-- 如果上面的密码不对，用这个正确的 bcrypt 密码（admin123）
-- UPDATE sys_user SET password = '$2b$10$vI8aWBnW8fK2ZTFS9K3n.eKTOZVZJ9QfRYA1qR3WlM0xCJ0YXQL2G' WHERE username = 'admin';
