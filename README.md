# PIS绩效指标管理系统

基于 Vue3 + Node.js + MySQL 的 ISO 22163 绩效指标管理平台。

## 功能特性

- 📊 项目管理 - 创建项目、分配人员、跟踪进度
- 📈 指标填报 - 填写PIS指标、上传文档证据
- 🧮 自动计算 - 实时计算达标率、加权汇总
- 📑 报表中心 - 达标率看板、趋势分析、导出报告
- 👥 权限管理 - 角色权限控制、部门隔离

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus
- Pinia
- Vue Router
- ECharts
- Axios

### 后端
- Node.js + Express
- MySQL 8.0
- JWT 认证
- bcrypt 加密

## 快速开始

### 方式一：Docker 运行（推荐）

#### Windows 环境要求
- Windows 10/11 专业版或企业版（启用 WSL2）
- Docker Desktop for Windows

#### 启动步骤

1. **安装 Docker Desktop**
   - 下载：https://www.docker.com/products/docker-desktop
   - 安装时勾选 "Use WSL 2 instead of Hyper-V"

2. **启动项目**
   ```powershell
   # 克隆项目
   git clone https://github.com/liyangmoney/MyIOS22163.git
   cd MyIOS22163

   # 启动所有服务（Docker 会自动构建镜像）
   docker-compose up -d

   # 等待 30 秒后访问
   # 前端：http://localhost
   # 后端 API：http://localhost:8080
   ```

3. **查看日志**
   ```powershell
   docker-compose logs -f
   ```

4. **停止服务**
   ```powershell
   docker-compose down
   ```

#### 数据持久化
- MySQL 数据存储在 Docker Volume `mysql_data`
- 上传文件存储在 `./backend/uploads`

---

### 方式二：传统方式运行

#### Windows 环境要求
- Node.js 20+ （https://nodejs.org）
- MySQL 8.0 （https://dev.mysql.com/downloads/installer/）

#### 1. 克隆项目

```powershell
git clone https://github.com/liyangmoney/MyIOS22163.git
cd MyIOS22163
```

#### 2. 数据库初始化

```powershell
# 使用 MySQL 命令行或 MySQL Workbench 导入
cd database
mysql -u root -p < pis_system.sql
```

#### 3. 后端启动

```powershell
cd backend

# 复制配置文件
copy .env.example .env

# 编辑 .env 文件，修改数据库配置
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=你的密码

npm install
npm run dev
```

#### 4. 前端启动

```powershell
cd frontend
npm install
npm run dev
```

#### 5. 访问系统

- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- 默认账号：admin / admin123

## 项目结构

```
pis-system/
├── docker-compose.yml  # Docker 编排配置
├── frontend/           # Vue3 前端
│   ├── Dockerfile      # 前端 Docker 配置
│   ├── nginx.conf      # Nginx 配置
│   ├── src/
│   │   ├── api/        # API 接口
│   │   ├── components/ # 组件
│   │   ├── router/     # 路由
│   │   ├── store/      # Pinia 状态
│   │   └── views/      # 页面
│   └── package.json
├── backend/            # Node.js 后端
│   ├── Dockerfile      # 后端 Docker 配置
│   ├── src/
│   │   ├── config/     # 配置
│   │   ├── controllers/# 控制器
│   │   ├── routes/     # 路由
│   │   └── utils/      # 工具
│   └── package.json
└── database/           # 数据库脚本
    └── pis_system.sql
```

## 核心功能

### 达标率计算

```
单个指标达标率 = 实际值 / 目标值 × 100%

项目整体达标率 = Σ(指标达标率 × 指标权重) / Σ权重
```

### 默认指标模板

| 指标名称 | 权重 | 目标值 | 类型 |
|---------|------|--------|------|
| 体系文件完成率 | 20% | 100% | ≥ |
| 内审不符合项关闭率 | 15% | 100% | ≥ |
| 培训计划完成率 | 10% | 100% | ≥ |
| FAI一次通过率 | 15% | 95% | ≥ |
| 设计评审通过率 | 15% | 100% | ≥ |
| 变更闭环率 | 15% | 100% | ≥ |
| 客户满意度 | 10% | 90% | ≥ |

## 开发计划

- [x] 基础架构搭建
- [x] 用户认证模块
- [x] 项目管理模块
- [x] 指标填报模块
- [x] 达标率计算引擎
- [x] 报表看板
- [x] Docker 部署支持
- [ ] 数据导入导出
- [ ] 消息通知
- [ ] 移动端适配

## Windows 常见问题

### 1. 端口被占用
```powershell
# 查看 8080 端口占用
netstat -ano | findstr :8080

# 结束占用进程（将 PID 替换为实际值）
taskkill /PID 12345 /F
```

### 2. MySQL 连接失败
- 检查 MySQL 服务是否启动
- 检查防火墙设置
- 确认 root 密码正确

### 3. Docker 启动失败
- 确保 Docker Desktop 已启动
- 检查 WSL2 是否启用
- 以管理员身份运行 PowerShell

## 许可证

MIT
