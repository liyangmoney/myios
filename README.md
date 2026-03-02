# MyIOS - ISO 22163 质量管理体系信息化平台

基于 Vue3 + Node.js + MySQL 的 ISO 22163 (IRIS) 质量管理体系数字化管理平台。

## 功能特性

### 程序文件管理
- 📑 **42个程序文件** - 完整的 ISO 22163 体系文件（C/M/S分类）
- 👥 **人员分配** - 为每个程序文件分配编写人、审核人、批准人
- 📎 **记录归档** - 上传和管理程序文件相关记录
- 📅 **年份控制** - 支持按年份归档和查询

### 质量事件管理 (PDCA)
- 📝 **事件创建** - 内部/外部不符合、审核发现、过程异常等
- 🔄 **PDCA工作流** - Plan → Do → Check → Act 完整闭环
- 📎 **附件管理** - 各阶段支持文件上传
- 📊 **统计分析** - 按状态、严重度、月度趋势分析

### 用户与权限
- 🔐 **JWT认证** - 安全的身份验证机制
- 👤 **用户管理** - 管理员创建用户，邮件通知
- 📝 **操作日志** - 完整的审计追踪

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus
- Pinia 状态管理
- Vue Router
- Axios

### 后端
- Node.js + Express
- MySQL 8.0
- JWT 认证
- bcrypt 加密
- nodemailer 邮件

## 快速部署

### 方式一：Docker 部署（推荐）

#### 环境要求
- Docker 20.10+
- Docker Compose 2.0+

#### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/liyangmoney/MyIOS.git
   cd MyIOS
   ```

2. **配置环境变量**
   ```bash
   cp backend/.env.example backend/.env
   # 编辑 backend/.env，配置数据库和邮件
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **初始化数据库**（首次运行）
   ```bash
   # 等待 MySQL 启动完成（约30秒）
   docker-compose exec mysql mysql -uroot -proot pis_system < database/schema.sql
   ```

5. **访问系统**
   - 前端：http://localhost:13000
   - 后端 API：http://localhost:9090
   - 默认账号：admin / admin123

#### 常用命令
```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建
docker-compose up -d --build
```

---

### 方式二：手动部署

#### 环境要求
- Node.js 18+
- MySQL 8.0+

#### 1. 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE pis_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入表结构
mysql -u root -p pis_system < database/schema.sql
```

#### 2. 后端部署

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件：
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret
# EMAIL_HOST=smtp.163.com
# EMAIL_USER=your_email@163.com
# EMAIL_PASS=your_auth_code

# 启动服务
npm run dev
# 或生产模式
npm start
```

#### 3. 前端部署

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

## 项目结构

```
MyIOS/
├── docker-compose.yml      # Docker 编排配置
├── frontend/               # Vue3 前端
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── components/    # 组件
│   │   ├── router/        # 路由
│   │   ├── store/         # Pinia 状态
│   │   └── views/         # 页面
│   └── package.json
├── backend/                # Node.js 后端
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   └── utils/         # 工具
│   ├── uploads/           # 上传文件存储
│   └── package.json
└── database/
    └── schema.sql         # 完整数据库脚本
```

## 配置文件说明

### 后端 .env
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pis_system

# JWT配置
JWT_SECRET=your_secret_key
JWT_EXPIRE=24h

# 邮件配置（用于用户通知）
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@163.com
EMAIL_PASS=your_auth_code
SYSTEM_URL=http://localhost:13000

# 服务器配置
PORT=9090
```

## 升级指南

### 从 v1.0.0 升级到 v1.1.x

1. **备份数据**
   ```bash
   mysqldump -u root -p pis_system > backup.sql
   ```

2. **拉取最新代码**
   ```bash
   git pull origin main
   ```

3. **更新数据库**（如有迁移脚本）
   ```bash
   # 查看 database/migrations/ 目录
   # 按顺序执行迁移脚本
   ```

4. **重启服务**
   ```bash
   docker-compose restart
   # 或手动重启前后端服务
   ```

## 常见问题

### 1. 数据库连接失败
- 检查 MySQL 服务是否启动
- 确认数据库配置正确
- 检查防火墙设置

### 2. 文件上传失败
- 检查 `backend/uploads` 目录权限
- 确认文件大小不超过 10MB

### 3. 邮件发送失败
- 确认邮箱 SMTP 设置正确
- 检查邮箱授权码（不是登录密码）

### 4. 端口冲突
```bash
# 查看端口占用
netstat -ano | grep :3000
netstat -ano | grep :9090

# 修改 docker-compose.yml 中的端口映射
```

## API 文档

启动后端服务后访问：
- Swagger UI: http://localhost:9090/api-docs

## 版本历史

- **v1.1.1** - PDCA附件功能完善
  - 各阶段附件上传与评论模块一致
  - 操作日志显示附件链接
  - 修复中文文件名乱码

- **v1.0.0** - 初始版本
  - 程序文件管理
  - 质量事件管理
  - 用户权限管理

## 许可证

MIT

## 联系方式

如有问题，请提交 GitHub Issue 或联系维护者。
