# GitHub Actions 自动构建 APK

已配置 GitHub Actions 工作流，自动构建 Android APK。

## 功能特性

- ✅ **自动构建**: 每次推送代码到 main 分支自动触发
- ✅ **手动触发**: 支持手动运行工作流
- ✅ **缓存优化**: Gradle 和 npm 依赖缓存，加快构建速度
- ✅ **Artifact 存储**: 构建好的 APK 自动上传，保留 30 天
- ✅ **Release 发布**: 支持创建带签名的 Release APK

## 使用方法

### 1. 自动构建（默认）

每次推送代码到 `main` 分支，且修改了 `frontend/` 目录下的文件时，会自动触发构建。

构建完成后，在 GitHub Actions 页面下载 APK。

### 2. 手动触发构建

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Build Android APK** 工作流
4. 点击 **Run workflow**
5. 选择分支（通常是 `main`）
6. 点击 **Run workflow**

### 3. 创建 Release 版本

1. 进入 **Actions** 页面
2. 选择 **Build Android APK**
3. 点击 **Run workflow**
4. 填写参数：
   - **Create release?**: 勾选 `true`
   - **Version name**: 输入版本号，如 `1.0.0`
5. 点击 **Run workflow**

## 获取 APK

### 方式一：从 Actions 下载

1. 进入 **Actions** 页面
2. 点击最新的构建记录
3. 页面底部找到 **Artifacts** 部分
4. 点击下载 `PIS-APK-xx` 文件

### 方式二：从 Release 下载

如果是 Release 构建，APK 会附加到 GitHub Release 页面：
1. 进入仓库 **Releases** 页面
2. 找到对应版本
3. 下载 APK 文件

## Release APK 签名配置

要构建签名的 Release APK，需要在 GitHub 仓库设置中添加以下 Secrets：

### 1. 生成签名密钥

在本地运行：

```bash
keytool -genkey -v -keystore pis-release-key.keystore -alias pis -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Base64 编码密钥文件

```bash
base64 -i pis-release-key.keystore | pbcopy  # Mac
# 或
base64 -i pis-release-key.keystore -w 0     # Linux
```

### 3. 添加 GitHub Secrets

进入仓库 **Settings** → **Secrets and variables** → **Actions**，添加：

| Secret 名称 | 说明 |
|------------|------|
| `KEYSTORE_BASE64` | Base64 编码的密钥文件内容 |
| `KEYSTORE_PASSWORD` | 密钥库密码 |
| `KEY_ALIAS` | 密钥别名 |
| `KEY_PASSWORD` | 密钥密码 |

### 4. 更新工作流（可选）

如果要支持自动签名，需要修改 `.github/workflows/build-apk.yml`，在 Build Release APK 步骤前添加解码密钥的步骤：

```yaml
- name: Decode keystore
  if: github.event.inputs.release == 'true'
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/pis-release-key.keystore
```

## 工作流配置说明

### 触发条件

```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'frontend/**'
  workflow_dispatch:  # 手动触发
```

### 构建环境

- **OS**: Ubuntu Latest
- **Node.js**: 20
- **Java**: 17 (Temurin)
- **Android SDK**: 通过 setup-android 安装

### 构建步骤

1. Checkout 代码
2. 设置 Node.js 和缓存
3. 设置 Java 和 Android SDK
4. 缓存 Gradle 依赖
5. 安装 npm 依赖
6. 构建前端 (`npm run build`)
7. 同步 Capacitor (`npx cap sync`)
8. 构建 APK (`./gradlew assembleDebug`)
9. 上传 Artifact

## 常见问题

### Q: 构建失败，提示 gradlew 权限问题？

A: 工作流中已包含 `chmod +x android/gradlew` 步骤，确保 gradlew 有执行权限。

### Q: 如何修改 APK 名称？

A: 修改工作流中的 Rename APK 步骤：

```yaml
- name: Rename APK
  run: |
    cp ./android/app/build/outputs/apk/debug/app-debug.apk ./output/你的名称.apk
```

### Q: 构建时间过长？

A: 首次构建会下载依赖，时间较长（约 5-10 分钟）。后续构建使用缓存，通常 2-3 分钟。

### Q: 只想构建 Release 不构建 Debug？

A: 修改工作流，移除 Build Debug APK 步骤，或添加条件判断。

### Q: 如何支持多个渠道包？

A: 可以在 Gradle 中配置 productFlavors，然后在 CI 中分别构建：

```yaml
- name: Build flavors
  run: |
    cd android
    ./gradlew assembleXiaomiRelease
    ./gradlew assembleHuaweiRelease
```

## 相关文件

- `.github/workflows/build-apk.yml` - GitHub Actions 工作流配置
- `frontend/capacitor.config.json` - Capacitor 配置
- `frontend/android/` - Android 项目

## 参考文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Capacitor Android 构建指南](https://capacitorjs.com/docs/android/building-your-app)
- [setup-android Action](https://github.com/android-actions/setup-android)
