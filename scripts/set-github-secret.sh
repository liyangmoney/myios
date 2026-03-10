#!/bin/bash
# 配置 GitHub Secret 脚本
# 需要先在本地安装 gh CLI 并登录: gh auth login

echo "正在设置 GitHub Secret..."

# 设置 API_BASE_URL
echo "API_BASE_URL=http://myjghy.myds.me:9090/api"
gh secret set API_BASE_URL -b"http://myjghy.myds.me:9090/api" -R liyangmoney/MyIOS

echo "✅ Secret 设置完成！"
echo ""
echo "下次构建 APK 时会自动使用这个服务器地址"
