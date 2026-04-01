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
- **新增指派阶段** - 部门负责人指派责任人和监督人
- **智能变更管理** - P阶段支持事件变更，自动关联源事件
- **根因分析工具** - A阶段支持原因类型多选分析
- **截止时间多次修改** - 部门负责人和创建人可修改，需填写原因
- **附件全生命周期** - 各阶段支持文件上传和评论关联

### 📊 数据统计分析
- **多维度筛选** - 按状态、严重度、类型、部门筛选
- **趋势分析** - 月度事件趋势图表
- **责任追踪** - 个人/部门事件统计
- **超期提醒** - 到期前72小时每6小时提醒，超期7天每天额外通知部门负责人

### 👥 用户与权限管理
- **JWT认证** - 安全的身份验证机制
- **部门领导** - 支持设置部门领导和职称
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
| Element Plus | 2.5.0 | UI组件库（锁定版本） |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | HTTP客户端 |
| ECharts | 5.x | 数据可视化 |
| Capacitor | 8.x | 移动端打包 |

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

## 🚀 Windows 开发环境部署

### 前置要求
- Windows 10/11
- Git
- Node.js 18+ 
- MySQL 8.0
- VS Code（推荐）

### 1. 克隆项目

```bash
git clone https://github.com/liyangmoney/MyIOS.git
cd MyIOS
```

### 2. 配置后端环境

```bash
# 进入后端目录
cd backend

# 复制环境变量模板
copy .env.example .env

# 编辑 .env 文件，配置数据库连接
notepad .env
```

**`.env` 配置示例：**

```env
# 服务器配置
PORT=9090
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pis_system

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=524288000

# 邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# 通知配置
NOTIFICATION_ENABLED=true
```

### 3. 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库（脚本会自动创建）
# 执行初始化脚本
mysql -u root -p pis_system < database/init.sql
```

### 4. 安装后端依赖

```bash
cd backend
npm install

# 启动开发服务器
npm run dev
```

后端服务将运行在 `http://localhost:9090`

### 5. 安装前端依赖

**注意：element-plus 必须锁定在 2.5.0 版本，否则 Windows 构建会失败**

```bash
cd frontend

# 确保使用项目自带的 package-lock.json
npm ci

# 或者如果 package-lock.json 不存在
npm install
```

### 6. 配置前端代理

编辑 `frontend/vite.config.js`，确保代理配置正确：

```javascript
server: {
  port: 13000,
  host: true,
  proxy: {
    '/api': {
      target: 'http://localhost:9090',
      changeOrigin: true
    }
  }
}
```

### 7. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

前端将运行在 `http://localhost:13000`

### 8. 访问系统

打开浏览器访问：`http://localhost:13000`

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

---

## 📱 移动端打包（Android）

### 前置要求
- Android Studio
- JDK 17
- Android SDK

### 打包步骤

```bash
cd frontend

# 构建生产版本
npm run build

# 同步到 Android 项目
npx cap sync android

# 打开 Android Studio
cd android
./gradlew assembleRelease
```

APK 输出路径：`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔧 常见问题

### 1. 前端启动报错 `Could not resolve '../../../utils/numbers.mjs'`

**原因：** element-plus 2.13.6 版本有 ESM 路径 bug

**解决：** 确保 package.json 中 element-plus 版本锁定为 `2.5.0`（不带 `^`）

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 2. 创建变更事件报 400 错误

**原因：** SQL 参数数量不匹配

**解决：** 检查后端 `createQualityEvent` 函数中的 SQL 字段数和 `?` 数量是否一致

### 3. 后端启动报错 `forceUpdate` 未导出

**原因：** version.js 缺少导出

**解决：** 确保 `backend/config/version.js` 包含：

```javascript
export const version = '1.8.2'
export const forceUpdate = false
export const minVersion = '1.0.0'
```

### 4. 数据库连接失败

**检查：**
- MySQL 服务是否启动
- `.env` 中的数据库配置是否正确
- 数据库 `pis_system` 是否已创建

---

## 📁 项目结构

```
MyIOS/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   └── utils/           # 工具函数
│   ├── config/              # 配置文件
│   ├── uploads/             # 上传文件目录
│   └── .env                 # 环境变量
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   ├── api/             # API 接口
│   │   └── stores/          # Pinia 状态
│   ├── android/             # Android 项目
│   └── dist/                # 构建输出
├── database/
│   └── init.sql             # 完整数据库初始化脚本
└── README.md
```

---

## 📝 版本历史

### v1.8.2 (当前版本)
- 新增指派阶段 - 创建事件选择责任部门和部门负责人
- 截止时间多次修改 - 部门负责人和创建人可修改，需填写原因
- 操作日志优化 - 显示"完成指派"、"完成计划"等中文标签
- 部门负责人显示职称
- 修复安卓端附件上传到 unknown 的问题
- 修复移动端表单和详情页功能
- 通知逻辑优化 - 到期提醒每6小时，超期7天额外通知部门负责人
- 锁定 element-plus 2.5.0 版本

### v1.8.1
- 基础功能版（指派阶段、截止时间修改、操作日志优化）

### v1.7.9
- 稳定版本参考

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request

---

## 📄 许可证

MIT License
