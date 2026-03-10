#!/bin/bash
# 修复 esbuild 版本不匹配问题

echo "🧹 清理依赖..."
rm -rf node_modules package-lock.json

echo "📦 重新安装依赖..."
npm install

echo "✅ 完成！现在可以运行 npm run dev 了"
