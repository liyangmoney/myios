# Zeabur 部署指南

## 1. 准备工作

### 1.1 注册 Zeabur 账号
- 访问 https://zeabur.com
- 使用 GitHub 账号登录

### 1.2 准备代码
确保代码已推送到 GitHub 仓库

## 2. 部署配置

### 2.1 创建 `zbpack.json` (Zeabur 配置文件)

```json
{
  "name": "myios",
  "services": [
    {
      "name": "frontend",
      "type": "static",
      "build": {
        "dockerfile": "frontend/Dockerfile"
      },
      "domain": "frontend"
    },
    {
      "name": "backend",
      "type": "docker",
      "build": {
        "dockerfile": "backend/Dockerfile"
      },
      "domain": "backend",
      "env": [
        "DB_HOST",
        "DB_PORT",
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
        "JWT_SECRET",
        "EMAIL_USER",
        "EMAIL_PASS",
        "APP_URL"
      ]
    },
    {
      "name": "mysql",
      "type": "mysql",
      "version": "8.0"
    }
  ]
}
```

### 2.2 修改前端 Dockerfile (Zeabur 优化版)

```dockerfile
# frontend/Dockerfile.zeabur
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 修改后端 Dockerfile (Zeabur 优化版)

```dockerfile
# backend/Dockerfile.zeabur
FROM node:20-alpine

WORKDIR /app

# 安装必要依赖
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm install --frozen-lockfile --production

COPY . .

# 确保上传目录存在
RUN mkdir -p /app/uploads/quality-events

EXPOSE 9090

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9090/health || exit 1

CMD ["npm", "start"]
```

### 2.4 创建健康检查接口

在 `backend/src/index.js` 中添加：

```javascript
// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

## 3. Zeabur 控制台配置

### 3.1 创建项目
1. 登录 Zeabur Dashboard
2. 点击 "Create Project"
3. 选择 "Deploy from GitHub"
4. 选择你的仓库

### 3.2 配置服务

#### MySQL 服务
1. 添加 MySQL 服务 (版本 8.0)
2. 记录连接信息：
   - Host: 自动生成
   - Port: 3306
   - Database: 自动生成
   - Username: 自动生成
   - Password: 自动生成

#### Backend 服务
1. 环境变量配置：
```
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_USER=${MYSQL_USERNAME}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
JWT_SECRET=your-secret-key-here
EMAIL_USER=jghy_glory@163.com
EMAIL_PASS=your-email-password
APP_URL=https://your-frontend-domain.zeabur.app
PORT=9090
```

#### Frontend 服务
1. 修改 `frontend/.env.production`：
```
VITE_API_BASE_URL=https://your-backend-domain.zeabur.app
```

## 4. 数据库初始化

### 4.1 使用 Zeabur MySQL Console
1. 进入 MySQL 服务页面
2. 点击 "Console" 或 "Connect"
3. 执行 schema.sql

### 4.2 或使用本地连接
```bash
# 获取 Zeabur MySQL 连接串
# 在 MySQL 服务页面点击 "Connection String"

mysql -h your-mysql-host.zeabur.app -u your-user -p pis_system < database/schema.sql
```

## 5. 注意事项

### 5.1 文件存储
Zeabur 是无状态部署，上传的文件会在重启后丢失！建议：
- 使用 Zeabur Object Storage (即将支持)
- 或使用 AWS S3 / 阿里云 OSS 等外部存储

临时解决方案（不推荐长期使用）：
- 定期备份 `/uploads` 目录
- 或使用 Dockerfile 中的 volume（重启会丢失）

### 5.2 环境变量
所有敏感信息都通过 Zeabur 环境变量管理，不要提交到代码仓库

### 5.3 域名配置
1. Frontend 会自动分配域名
2. Backend 也会分配独立域名
3. 可以在设置中绑定自定义域名

### 5.4 免费额度
- Zeabur 免费版有一定资源限制
- 如需更多资源可升级到付费版

## 6. 部署后检查

1. 访问前端页面是否正常
2. 测试登录功能
3. 测试文件上传（注意：重启后文件会丢失）
4. 测试邮件通知功能

## 7. 问题排查

### 查看日志
在 Zeabur Dashboard 中点击服务 -> Logs

### 常见问题
1. **数据库连接失败**: 检查环境变量是否正确
2. **前端无法连接后端**: 检查 `VITE_API_BASE_URL` 配置
3. **文件上传失败**: 检查上传目录权限
4. **服务重启后数据丢失**: 这是正常的，需要使用外部存储

## 8. 生产建议

由于 Zeabur 是无状态部署，建议：
1. 使用外部 MySQL 服务（如 AWS RDS、阿里云 RDS）
2. 使用外部文件存储（如 AWS S3、阿里云 OSS）
3. 定期备份数据库

如果只是测试使用，Zeabur 完全够用！
