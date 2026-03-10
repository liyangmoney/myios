#!/bin/bash
# PIS 系统 APK 构建脚本

set -e

echo "🚀 开始构建 PIS 系统 APK..."

# 1. 构建前端
echo "📦 构建前端..."
npm run build

# 2. 同步到 Android
echo "📱 同步到 Android 项目..."
npx cap sync android

# 3. 构建 Debug APK
echo "🔨 构建 Debug APK..."
cd android
./gradlew assembleDebug

echo "✅ 构建完成！"
echo ""
echo "📁 APK 位置:"
echo "   Debug:   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 提示:"
echo "   - Debug APK 可以直接安装测试"
echo "   - 如需构建 Release APK，请先配置签名密钥"
