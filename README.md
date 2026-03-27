# MyIOS - ISO 22163 质量管理体系信息化平台

> 基于 Vue3 + Node.js + MySQL 的 ISO 22163 (IRIS) 质量管理体系数字化管理平台
> 
> 🎯 **PDCA闭环管理** | 📊 **数据驱动决策** | 🔐 **企业级安全**

---

## 🌟 核心特性

### 📑 程序文件管理
- **42个标准程序文件** - 完整的 ISO 22163 体系文件（C/M/S分类）
- **智能人员分配** - 为每个程序文件分配编写人、审核人、批准人
- **版本控制** - 支持按年份归档和版本追溯
- **附件管理** - 程序文件相关记录的数字化归档

### 🔄 质量事件管理（PDCA闭环）
- **多维度事件创建** - 内部/外部不符合、审核发现、过程异常、指标异常
- **完整PDCA工作流** - Plan → Do → Check → Act 闭环跟踪
- **智能变更管理** - P阶段支持事件变更，自动关联源事件
- **根因分析工具** - A阶段支持原因类型多选分析
- **附件全生命周期** - 各阶段支持文件上传和评论关联

### 📊 数据统计分析
- **多维度筛选** - 按状态、严重度、类型、部门筛选
- **趋势分析** - 月度事件趋势图表
- **责任追踪** - 个人/部门事件统计
- ** overdue提醒** - 超期未关闭事件自动提醒

### 👥 用户与权限管理
- **JWT认证** - 安全的身份验证机制
- **角色分级** - 管理员、质量人员、普通用户
- **邮件通知** - 事件流转自动邮件提醒
- **完整审计日志** - 操作全程可追溯

---

## 🏗️ 技术架构

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.x | 渐进式框架 |
| Vite | 5.x | 构建工具 |
| Element Plus | 2.x | UI组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | HTTP客户端 |
| ECharts | 5.x | 数据可视化 |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| Express | 4.x | Web框架 |
| MySQL | 8.0 | 数据库 |
| JWT | 9.x | 身份认证 |
| bcrypt | 5.x | 密码加密 |
| nodemailer | 6.x | 邮件服务 |
| Multer | 1.x | 文件上传 |

---

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

#### 环境要求
- Docker 20.10+
- Docker Compose 2.0+

#### 1. 克隆项目
```bash
git clone https://github.com/liyangmoney/MyIOS.git
cd MyIOS
```

#### 2. 配置环境
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置
vim backend/.env
```

#### 3. 启动服务
```bash
docker-compose up -d

# 等待30秒让MySQL初始化
docker-compose logs -f mysql
```

#### 4. 初始化数据库
```bash
# 首次运行需要导入表结构
docker-compose exec -T mysql mysql -uroot -proot pis_system < database/schema.sql

# 执行迁移（如有更新）
docker-compose exec -T mysql mysql -uroot -proot pis_system < database/migrations/20250323_add_event_fields.sql
```

#### 5. 访问系统
- 🌐 前端：http://localhost:13000
- 🔌 API：http://localhost:9090
- 👤 默认账号：`admin` / `admin123`

---

### 方式二：手动部署

#### 环境要求
- Node.js 18+
- MySQL 8.0+

#### 1. 数据库准备
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE pis_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入表结构
mysql -u root -p pis_system < database/schema.sql

# 执行迁移
mysql -u root -p pis_system < database/migrations/20250323_add_event_fields.sql
```

#### 2. 后端启动
```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env

# 启动开发服务器
npm run dev

# 或生产模式
npm start
```

#### 3. 前端启动
```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

---

## 📁 项目结构

```
MyIOS/
├── 📁 .github/           # GitHub Actions CI/CD
├── 📁 backend/            # Node.js 后端
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   └── utils/         # 工具函数
│   ├── uploads/           # 上传文件存储
│   ├── .env.example       # 环境变量模板
│   └── package.json
├── 📁 frontend/           # Vue3 前端
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Pinia状态
│   │   └── views/         # 页面视图
│   └── package.json
├── 📁 database/           # 数据库脚本
│   ├── schema.sql         # 完整表结构
│   └── migrations/        # 迁移脚本
├── 📁 docs/               # 项目文档
├── 📄 docker-compose.yml  # Docker配置
└── 📄 README.md           # 项目说明
```

---

## ⚙️ 配置说明

### 后端 .env 配置
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pis_system

# JWT配置
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h

# 邮件服务（用于通知）
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@163.com
EMAIL_PASS=your_auth_code
SYSTEM_URL=http://localhost:13000

# 服务端口
PORT=9090
```

### 前端配置
前端配置位于 `frontend/.env`：
```env
VITE_API_BASE_URL=http://localhost:9090
```

---

## 📈 核心功能模块

### 1️⃣ 程序文件管理
| 功能 | 说明 |
|------|------|
| 文件分类 | C(顾客相关)/M(管理)/S(支持) 三大类 |
| 人员分配 | 编写人、审核人、批准人三级审批 |
| 记录归档 | 上传PDF、Word、Excel等附件 |
| 年份归档 | 按年份查看历史版本 |

### 2️⃣ 质量事件管理
| 阶段 | 功能 |
|------|------|
| **Plan** | 问题描述、根因分析、纠正措施、变更管理 |
| **Do** | 措施执行、责任人分配、期限设定 |
| **Check** | 效果验证、监督检查 |
| **Act** | 标准化、预防措施、原因类型分析 |

### 3️⃣ 用户权限
| 角色 | 权限 |
|------|------|
| 管理员 | 用户管理、系统配置、数据导出 |
| 质量人员 | 事件创建、编辑、审核、统计分析 |
| 普通用户 | 查看事件、上传附件、执行措施 |

---

## 🔧 常用命令

### Docker 命令
```bash
# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build

# 进入容器
docker-compose exec backend sh
docker-compose exec mysql mysql -uroot -proot pis_system
```

### 数据库命令
```bash
# 备份数据
mysqldump -u root -p pis_system > backup_$(date +%Y%m%d).sql

# 恢复数据
mysql -u root -p pis_system < backup_20250101.sql

# 查看迁移状态
ls -la database/migrations/
```

---

## 🐛 常见问题

### 1. 数据库连接失败
```bash
# 检查MySQL状态
docker-compose ps mysql
docker-compose logs mysql

# 检查端口占用
netstat -tlnp | grep 3306
```

### 2. 文件上传失败
```bash
# 检查目录权限
docker-compose exec backend ls -la uploads/
docker-compose exec backend chmod 755 uploads/
```

### 3. 邮件发送失败
- 确认使用的是邮箱授权码（不是登录密码）
- 检查邮箱SMTP设置是否正确
- 查看后端日志：`docker-compose logs backend | grep email`

### 4. 前端页面空白
```bash
# 清除缓存并重建
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

---

## 📝 API 文档

启动后端服务后访问 Swagger UI：
- 📘 http://localhost:9090/api-docs

---

## 🔄 版本历史

### v1.2.0 (2025-03-27)
- ✅ PDCA附件功能完善
- ✅ 事件详情页新字段显示
- ✅ 数据库表结构升级
- ✅ 质量事件P阶段变更功能
- ✅ A阶段原因类型多选

### v1.1.0 (2025-03-20)
- ✅ 程序文件管理模块
- ✅ 用户权限分级
- ✅ 操作日志系统

### v1.0.0 (2025-03-01)
- ✅ 质量事件管理基础版
- ✅ PDCA工作流
- ✅ JWT认证

---

## 📋 待办事项

- [ ] 移动端适配
- [ ] 数据大屏可视化
- [ ] AI智能分析建议
- [ ] 多语言支持

---

## 📄 许可证

MIT License © 2025 MyIOS Team

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -am 'Add feature'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

---

## 📞 联系方式

- 📧 邮箱：liyangmoney@example.com
- 🐛 Issue：[GitHub Issues](https://github.com/liyangmoney/MyIOS/issues)
- 💬 讨论：[GitHub Discussions](https://github.com/liyangmoney/MyIOS/discussions)

---

<p align="center">
  <b>MyIOS - 让质量管理更简单</b>
</p>