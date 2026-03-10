# 前端运行方式说明

## 三种使用场景

### 1. H5 开发调试（本地开发）
```bash
cd frontend
npm run dev
```
- 访问地址：http://localhost:13000
- 自动代理 `/api` 到本地后端 http://localhost:9090
- 支持热更新，改代码自动刷新

### 2. H5 生产部署（网页版）
```bash
cd frontend
npm run build
```
- 生成 `dist/` 文件夹
- 部署到 Nginx/Apache 即可访问
- 需要配置 API 地址指向真实服务器

### 3. APK 打包（手机APP）
```bash
cd frontend
npm run build        # 构建前端
npx cap sync android # 同步到 Android 项目
cd android && ./gradlew assembleDebug  # 打包 APK
```
- 使用 Capacitor 把网页打包成原生 APP
- APP 内嵌 WebView 显示页面
- 通过配置文件指定后端 API 地址

---

## 关键区别

| 场景 | 运行环境 | API 地址 |
|------|----------|----------|
| H5 开发 | 浏览器 | `/api` (Vite 代理到 localhost:9090) |
| H5 部署 | 浏览器 | `http://myjghy.myds.me:9090/api` |
| APK | WebView | `http://myjghy.myds.me:9090/api` 或用户配置 |

---

## 你的实际情况

**只需要一个前端代码库！**

根据你想怎么运行，选择对应的命令：

```bash
# 本地开发调试 → 用 H5 开发模式
npm run dev

# 构建网页部署 → 生成 dist 文件夹
npm run build

# 打包手机 APK → 用 GitHub Actions 自动构建
# 或本地运行 ./build-apk.sh
```

---

## 常见问题

### Q: H5 开发和 APK 能不能同时跑？
A: 可以！但 H5 开发模式用的是 Vite 代理，APK 需要真实地址。建议：
- 开发时用 `npm run dev`（H5 模式）
- 测试 APK 时构建新版本安装到手机

### Q: 为什么 esbuild 报版本错误？
A: GitHub Actions 用 Node.js 22 安装的依赖，和你本地 Node.js 版本不同。
解决方法：
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q: APK 能不能连本地开发服务器？
A: 可以，但需要：
1. 手机和电脑在同一 WiFi
2. 用电脑的内网 IP（如 http://192.168.1.100:9090）
3. 在 Profile 页面修改服务器地址

### Q: 后端服务需要几个？
A: 只需要一个后端服务（Node.js + MySQL），所有前端都连它。
