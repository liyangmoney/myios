#!/bin/bash
# 同步版本号到前端配置文件

VERSION=$(grep "export const version" backend/config/version.js | sed 's/.*= '\''\([^'\''"]*\)'\''.*/\1/')
echo "Syncing version: $VERSION"
echo "export const version = '$VERSION'" > frontend/src/config/version.js
echo "Version synced to frontend/src/config/version.js"