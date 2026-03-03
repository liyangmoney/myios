#!/bin/bash
# ============================================
# PIS 系统自动备份脚本
# 备份内容：MySQL 数据库 + 上传的文件
# 建议添加到 crontab 定时执行
# ============================================

# 配置
BACKUP_DIR="/opt/backups/pis-system"  # 备份存储目录
DB_NAME="pis_system"                   # 数据库名
DB_USER="root"                         # 数据库用户
DB_PASS="your_password"                # 数据库密码
UPLOAD_DIR="/opt/MyIOS/backend/uploads" # 上传文件目录
KEEP_DAYS=30                           # 保留最近30天的备份

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="db_${DATE}.sql"
FILES_BACKUP="uploads_${DATE}.tar.gz"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "PIS 系统备份开始: $(date)"
echo "========================================"

# 1. 备份数据库
echo -e "${YELLOW}[1/3] 正在备份数据库...${NC}"
if mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/$DB_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✓ 数据库备份成功: $DB_BACKUP${NC}"
    # 压缩 SQL 文件
    gzip "$BACKUP_DIR/$DB_BACKUP"
    echo -e "${GREEN}✓ 已压缩: ${DB_BACKUP}.gz${NC}"
else
    echo -e "${RED}✗ 数据库备份失败${NC}"
    exit 1
fi

# 2. 备份上传文件
echo -e "${YELLOW}[2/3] 正在备份上传文件...${NC}"
if [ -d "$UPLOAD_DIR" ]; then
    tar -czf "$BACKUP_DIR/$FILES_BACKUP" -C "$(dirname $UPLOAD_DIR)" "$(basename $UPLOAD_DIR)"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 文件备份成功: $FILES_BACKUP${NC}"
    else
        echo -e "${RED}✗ 文件备份失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 上传目录不存在，跳过文件备份${NC}"
fi

# 3. 清理旧备份
echo -e "${YELLOW}[3/3] 清理旧备份 (保留${KEEP_DAYS}天)...${NC}"
DELETED=$(find "$BACKUP_DIR" -name "*.gz" -o -name "*.tar.gz" -mtime +$KEEP_DAYS | wc -l)
find "$BACKUP_DIR" -name "*.gz" -o -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 已删除 $DELETED 个旧备份文件${NC}"
else
    echo -e "${YELLOW}⚠ 旧备份清理可能失败${NC}"
fi

# 4. 输出备份信息
echo ""
echo "========================================"
echo -e "${GREEN}备份完成: $(date)${NC}"
echo "备份位置: $BACKUP_DIR"
echo "备份文件:"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5
echo "========================================"
