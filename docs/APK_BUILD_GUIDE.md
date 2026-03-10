# PIS 移动端 APK 构建指南

将 PIS 网页应用打包成 Android APK。

## 技术方案

使用 **Capacitor** 作为混合应用框架：
- 支持现代 Web 技术（Vue3、Vite）
- 提供原生 API 访问能力
- 构建简单，维护成本低

## 环境要求

- Node.js 18+
- Android SDK（通过 Android Studio 安装）
- Java JDK 11+

## 快速开始

### 1. 安装依赖（已完成）

```bash
cd frontend
npm install
```

### 2. 构建 APK

#### 方式一：使用脚本（推荐）

```bash
cd frontend
./build-apk.sh
```

#### 方式二：手动步骤

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 构建 Debug APK
cd android
./gradlew assembleDebug
```

### 3. 获取 APK

构建完成后，APK 文件位置：

```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## 安装到手机

### 方法 1：直接安装（Debug 版本）

```bash
# 连接手机，开启 USB 调试
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### 方法 2：传输安装

1. 将 APK 文件发送到手机（微信、QQ、邮件等）
2. 在手机上点击安装
3. 可能需要允许"未知来源"安装

### 方法 3：使用 Android Studio

1. 打开 Android Studio
2. 选择 `frontend/android` 文件夹
3. 连接手机或启动模拟器
4. 点击运行按钮

## 项目配置

### Capacitor 配置

文件：`frontend/capacitor.config.json`

```json
{
  "appId": "com.liyangmoney.pis",
  "appName": "PIS系统",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true
  }
}
```

### 后端 API 地址

前端需要配置正确的后端 API 地址：

编辑 `frontend/.env.production`：

```env
VITE_API_BASE_URL=http://你的服务器IP:9090/api
```

或使用相对路径（如果部署在同一域名）：

```env
VITE_API_BASE_URL=/api
```

## 构建 Release APK（发布版）

### 1. 生成签名密钥

```bash
cd frontend/android
keytool -genkey -v -keystore pis-release-key.keystore -alias pis -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置签名信息

编辑 `frontend/capacitor.config.json`：

```json
{
  "android": {
    "buildOptions": {
      "keystorePath": "pis-release-key.keystore",
      "keystoreAlias": "pis",
      "keystorePassword": "你的密码",
      "keystoreAliasPassword": "你的密码"
    }
  }
}
```

### 3. 构建 Release APK

```bash
cd frontend/android
./gradlew assembleRelease
```

APK 位置：`app/build/outputs/apk/release/app-release.apk`

## 常见问题

### Q: 安装后无法连接后端？

A: 检查以下几点：
1. 后端服务器是否可访问
2. `capacitor.config.json` 中的 `cleartext` 是否设置为 `true`（如果使用 HTTP）
3. 手机网络是否能访问服务器（同一局域网或公网）

### Q: 如何更新应用？

A: 重新构建 APK 并安装，Android 会自动覆盖旧版本。

### Q: 如何添加原生功能（如推送通知）？

A: 安装 Capacitor 插件：

```bash
npm install @capacitor/push-notifications
npx cap sync android
```

### Q: 构建失败？

A: 检查：
1. Android SDK 是否正确安装
2. JAVA_HOME 环境变量是否设置
3. 运行 `./gradlew clean` 后重试

## 文件结构

```
frontend/
├── capacitor.config.json     # Capacitor 配置
├── android/                   # Android 项目
│   ├── app/
│   │   └── src/
│   │       └── main/
│   │           └── AndroidManifest.xml
│   └── build.gradle
├── build-apk.sh              # 构建脚本
└── dist/                     # 前端构建输出
```

## 相关文档

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发者指南](https://developer.android.com/)
