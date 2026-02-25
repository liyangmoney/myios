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

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/MyIOS22163.git
cd MyIOS22163
```

### 2. 数据库初始化

```bash
mysql -u root -p < database/pis_system.sql
```

### 3. 后端启动

```bash
cd backend
cp .env.example .env
# 编辑 .env 配置数据库连接
npm install
npm run dev
```

### 4. 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 5. 访问系统

- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- 默认账号：admin / admin123

## 项目结构

```
pis-system/
├── frontend/          # Vue3 前端
│   ├── src/
│   │   ├── api/      # API 接口
│   │   ├── components/# 组件
│   │   ├── router/   # 路由
│   │   ├── store/    # Pinia 状态
│   │   └── views/    # 页面
│   └── package.json
├── backend/           # Node.js 后端
│   ├── src/
│   │   ├── config/   # 配置
│   │   ├── controllers/# 控制器
│   │   ├── routes/   # 路由
│   │   └── utils/    # 工具
│   └── package.json
└── database/          # 数据库脚本
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
- [ ] 数据导入导出
- [ ] 消息通知
- [ ] 移动端适配

## 许可证

MIT
