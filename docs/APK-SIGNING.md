# Android APK 签名与版本管理说明

## 1. 版本号管理

### 前端版本号 (appUpdate.js)
```javascript
const CURRENT_VERSION = '1.0.2'  // 每次发版时更新
```

### 后端版本号 (backend/src/index.js)
```javascript
version: '1.0.2'  // 与前端保持一致
```

**重要**: 每次发布新版本时，两个地方都要更新！

---

## 2. APK 签名说明

### Debug 签名（开发/测试用）
- 自动生成，无需配置
- 不同电脑生成的签名不同
- **无法覆盖安装**（签名不一致）

### Release 签名（正式发布用）
需要创建签名文件并配置：

```bash
# 创建签名文件（只需执行一次）
cd frontend/android
keytool -genkey -v -keystore pis-release.keystore -alias pis -keyalg RSA -keysize 2048 -validity 10000
```

配置 `capacitor.config.json`:
```json
{
  "android": {
    "buildOptions": {
      "keystorePath": "android/pis-release.keystore",
      "keystoreAlias": "pis",
      "keystorePassword": "你的密码",
      "keystoreAliasPassword": "你的密码"
    }
  }
}
```

---

## 3. 为什么需要删除旧 APK 才能安装？

### 原因
1. **签名不同**: Debug 签名每台电脑都不同
2. **版本号相同**: Android 不允许相同版本号覆盖安装

### 解决方案
#### 方案 A: 使用相同的 Debug 签名（推荐测试用）
将签名文件提交到仓库：
```bash
# 复制当前电脑的 debug 签名
cp ~/.android/debug.keystore frontend/android/

# 配置使用固定签名
echo "debug.keystore=debug.keystore" >> frontend/android/local.properties
```

#### 方案 B: 使用 Release 签名（推荐正式发布）
创建 Release 签名并统一使用。

#### 方案 C: 先卸载再安装（最简单）
安装前手动删除旧版本。

---

## 4. 版本号规则

使用语义化版本号：**主版本.次版本.修订号**

| 版本变化 | 说明 | 示例 |
|---------|------|------|
| 修订号 +1 | Bug 修复 | 1.0.1 → 1.0.2 |
| 次版本 +1 | 新功能 | 1.0.2 → 1.1.0 |
| 主版本 +1 | 重大更新 | 1.1.0 → 2.0.0 |

---

## 5. 发布流程

1. 更新版本号（前端 + 后端）
2. 提交代码并推送
3. GitHub Actions 自动构建 APK
4. 下载 APK 文件
5. 上传到服务器 `backend/app/pis-latest.apk`
6. 重启后端服务
7. 用户打开 APP 自动检测更新

---

## 6. 自动更新流程

```
用户打开 APP
    ↓
调用 checkAndUpdateApp()
    ↓
请求 /api/app/version
    ↓
比较版本号
    ↓
有新版本？→ 弹出更新提示
    ↓
用户确认 → 浏览器下载 APK
    ↓
用户手动安装
```
