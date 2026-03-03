#!/bin/bash
# ============================================
# Docker 环境备份脚本
# 在 backup 容器内执行
# ============================================

BACKUP_DIR="/backups"
DB_NAME="pis_system"
DB_USER="root"
DB_PASS="${MYSQL_ROOT_PASSWORD:-root123}"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "[$(date)] 开始备份..."

# 备份数据库
mysqldump -h mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

if [ $? -eq 0 ]; then
    echo "[$(date)] ✓ 数据库备份成功: db_${DATE}.sql.gz"
else
    echo "[$(date)] ✗ 数据库备份失败"
    exit 1
fi

# 清理30天前的备份
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "[$(date)] 备份完成"
