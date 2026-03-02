# Zeabur 部署架构说明

## 1. 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Zeabur 平台                          │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │   Frontend 服务     │    │   Backend 服务      │         │
│  │   (静态网站)         │    │   (Node.js API)     │         │
│  │                     │    │                     │         │
│  │  Domain:            │    │  Domain:            │         │
│  │  myios-web.zeabur.app│◄───│  myios-api.zeabur.app│         │
│  │                     │    │       │             │         │
│  └─────────────────────┘    │       │             │         │
│            ▲                │       ▼             │         │
│            │                │  ┌─────────────────┐│         │
│            │                └──│  MySQL 服务      ││         │
│            │                   │  (数据库)        ││         │
│            │                   │                 ││         │
│            │                   │  内部域名:        ││         │
│            │                   │  mysql.zeabur.app││         │
│            │                   └─────────────────┘│         │
│            │                                   ▲   │         │
│            │                                   │   │         │
│            └───────────────────────────────────┘   │         │
│                   API 请求代理                      │         │
└─────────────────────────────────────────────────────────────┘
```

## 2. 服务划分

### Frontend 服务（前端）
- **类型**: 静态网站 (Static Site)
- **源码**: `/frontend` 目录
- **构建**: `npm run build` → `dist/` 目录
- **访问**: `https://xxx.zeabur.app`
- **特点**: 纯静态文件，无服务器端代码

### Backend 服务（后端）
- **类型**: Docker 容器
- **源码**: `/backend` 目录
- **运行**: Node.js + Express
- **访问**: `https://yyy.zeabur.app`
- **特点**: 提供 REST API，连接数据库

### MySQL 服务（数据库）
- **类型**: 托管数据库 (Managed MySQL)
- **版本**: MySQL 8.0
- **访问**: 内网域名，仅 Backend 可访问
- **特点**: 数据持久化存储

## 3. 通信方式

### 前端 → 后端
由于前端和后端是两个独立的域名，需要处理跨域：

**方式一：直接调用（有 CORS 问题）**
```javascript
// 前端代码
fetch('https://myios-api.zeabur.app/api/quality-events')
// 会被浏览器拦截，因为跨域
```

**方式二：代理转发（推荐）**
```javascript
// Zeabur 支持配置前端代理到后端
// 前端请求 /api/* 自动转发到后端服务
fetch('/api/quality-events')  // 同域请求
```

### 后端 → 数据库
```javascript
// 后端代码
const dbConfig = {
  host: process.env.MYSQL_HOST,      // Zeabur 自动注入
  port: process.env.MYSQL_PORT,      // 3306
  user: process.env.MYSQL_USERNAME,  // 自动生成的用户名
  password: process.env.MYSQL_PASSWORD,  // 自动生成的密码
  database: process.env.MYSQL_DATABASE   // 自动创建的数据库
}
```

## 4. 部署步骤

### 步骤1：准备代码
确保代码已推送到 GitHub，包含：
- `frontend/` - Vue3 前端
- `backend/` - Node.js 后端
- `zbpack.json` - Zeabur 配置

### 步骤2：创建 Zeabur 项目
1. 登录 https://zeabur.com
2. 创建项目 → Deploy from GitHub
3. 选择仓库

### 步骤3：添加 MySQL 服务
1. 点击 "Create Service"
2. 选择 "Marketplace" → "MySQL"
3. 等待创建完成
4. 记下连接信息（会自动注入为环境变量）

### 步骤4：部署 Backend
Zeabur 会自动识别 `zbpack.json` 中的 backend 配置：
1. 从 `/backend/Dockerfile` 构建镜像
2. 自动绑定环境变量（MYSQL_HOST 等）
3. 分配域名：`https://xxx.zeabur.app`

**环境变量配置：**
```
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_USER=${MYSQL_USERNAME}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@163.com
EMAIL_PASS=your-auth-code
APP_URL=https://your-frontend-domain.zeabur.app
```

### 步骤5：部署 Frontend
1. 点击 "Create Service"
2. 选择 "Static Site"
3. 根目录选择 `/frontend`
4. 构建命令：`npm run build`
5. 输出目录：`dist`

**环境变量配置：**
```
# 关键：让前端知道后端地址
VITE_API_BASE_URL=https://your-backend-domain.zeabur.app
```

### 步骤6：配置代理（关键！）
在前端服务的设置中，配置路由规则：
```
/api/*  →  转发到 Backend 服务
```

或者在 `zbpack.json` 中配置：
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://myios-api.zeabur.app/api/$1"
    }
  ]
}
```

### 步骤7：初始化数据库
1. 进入 MySQL 服务的 Console
2. 执行：
```sql
source /path/to/database/schema.sql
```

或者使用 Zeabur 的 MySQL 连接信息，本地导入：
```bash
mysql -h xxxx.zeabur.app -u xxxx -p pis_system < database/schema.sql
```

## 5. 访问方式

部署完成后，你会得到两个域名：

| 服务 | 域名 | 用途 |
|------|------|------|
| Frontend | `https://myios-web.zeabur.app` | 用户访问的页面 |
| Backend | `https://myios-api.zeabur.app` | API 接口（一般不直接访问） |

用户只需要访问 Frontend 域名即可。

## 6. 注意事项

### 文件存储问题
Zeabur 是无状态部署，上传的文件会丢失！

**解决方案：**
1. 使用外部存储（AWS S3、阿里云 OSS）
2. 或定期备份 `/uploads` 目录
3. 或使用 Zeabur 的 Object Storage（即将支持）

### 环境变量
- 不要在代码中硬编码敏感信息
- 所有配置通过 Zeabur 控制台的环境变量设置

### 免费额度
- Zeabur 免费版有一定资源限制
- 如果流量大，建议升级到付费版

## 7. 与 Docker Compose 的区别

| 特性 | Docker Compose (本地) | Zeabur (云端) |
|------|---------------------|--------------|
| 服务关系 | 同一网络，通过服务名访问 | 独立域名，通过公网访问 |
| 数据库 | MySQL 容器 | 托管 MySQL 服务 |
| 文件存储 | 本地卷持久化 | 无状态，重启丢失 |
| 域名 | localhost | 自动分配 HTTPS 域名 |
| 扩展性 | 单机 | 可横向扩展 |

## 8. 总结

Zeabur 部署时：
1. **前端** 和 **后端** 是分开的两个服务
2. 通过 **环境变量** 让前端知道后端地址
3. 通过 **代理配置** 让前端请求转发到后端
4. **数据库** 是托管服务，后端通过内网连接

不是"全部部署到一起"，而是"部署为独立但关联的服务"。
