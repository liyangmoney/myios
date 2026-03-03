#!/bin/bash
# ============================================
# PIS 系统恢复脚本
# ============================================

BACKUP_DIR="/opt/backups/pis-system"
DB_NAME="pis_system"
DB_USER="root"
DB_PASS="your_password"
UPLOAD_DIR="/opt/MyIOS/backend/uploads"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "PIS 系统恢复"
echo "========================================"

# 列出可用备份
echo ""
echo "可用的数据库备份:"
ls -1t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | head -10 | nl

echo ""
echo "可用的文件备份:"
ls -1t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | head -10 | nl

echo ""
read -p "请输入要恢复的数据库备份编号 (或按回车跳过): " db_num
read -p "请输入要恢复的文件备份编号 (或按回车跳过): " file_num

# 恢复数据库
if [ -n "$db_num" ]; then
    DB_FILE=$(ls -1t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | head -10 | sed -n "${db_num}p")
    if [ -f "$DB_FILE" ]; then
        echo -e "${YELLOW}正在恢复数据库: $(basename $DB_FILE)${NC}"
        
        # 先备份当前数据库
        mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/db_before_restore_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null
        
        # 恢复
        gunzip < "$DB_FILE" | mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 数据库恢复成功${NC}"
        else
            echo -e "${RED}✗ 数据库恢复失败${NC}"
        fi
    else
        echo -e "${RED}✗ 无效的备份编号${NC}"
    fi
fi

# 恢复文件
if [ -n "$file_num" ]; then
    FILE_BACKUP=$(ls -1t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | head -10 | sed -n "${file_num}p")
    if [ -f "$FILE_BACKUP" ]; then
        echo -e "${YELLOW}正在恢复上传文件: $(basename $FILE_BACKUP)${NC}"
        
        # 先备份当前文件
        tar -czf "$BACKUP_DIR/uploads_before_restore_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$(dirname $UPLOAD_DIR)" "$(basename $UPLOAD_DIR)"
        
        # 恢复
        rm -rf "$UPLOAD_DIR"
        tar -xzf "$FILE_BACKUP" -C "$(dirname $UPLOAD_DIR)"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 文件恢复成功${NC}"
        else
            echo -e "${RED}✗ 文件恢复失败${NC}"
        fi
    else
        echo -e "${RED}✗ 无效的备份编号${NC}"
    fi
fi

echo ""
echo "========================================"
echo "恢复完成"
echo "========================================"
