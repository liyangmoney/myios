# 定时清理孤儿文件

## 手动运行

```bash
cd /path/to/MyIOS/backend
node scripts/cleanup-orphan-files.js
```

## 使用 cron 定时运行（推荐）

### 1. 编辑 crontab

```bash
crontab -e
```

### 2. 添加定时任务（每天凌晨2点运行）

```
# 每天凌晨2点清理孤儿文件
0 2 * * * cd /path/to/MyIOS/backend && /usr/bin/node scripts/cleanup-orphan-files.js >> /var/log/myios-cleanup.log 2>&1
```

### 3. 查看日志

```bash
# 实时查看
tail -f /var/log/myios-cleanup.log

# 查看数据库中的清理记录
mysql -u root -p myios -e "SELECT * FROM cleanup_log ORDER BY created_at DESC LIMIT 10;"
```

## 清理规则

1. **只删除1天以上的文件** - 避免误删正在上传的文件
2. **只删除未被数据库引用的文件** - 通过检查 `plan_files`, `implementation_files`, `check_files`, `act_files` 字段
3. **删除空目录** - 清理空的事件目录
4. **记录日志** - 所有操作记录到 `cleanup_log` 表

## 安全机制

- ✅ 宁可放过，不要错删
- ✅ 1天内的新文件不处理
- ✅ 被数据库引用的文件不处理
- ✅ 详细日志记录，便于排查

## 手动恢复（误删时）

如果误删了文件，可以从备份恢复：

```bash
# 假设备份在 /backup/uploads
cp /backup/uploads/quality-events/QE-xxx/文件名.jpg /path/to/MyIOS/backend/uploads/quality-events/QE-xxx/
```
