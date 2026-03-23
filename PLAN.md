# MyIOS 项目整改 - 剩余任务执行计划

## 当前状态分析

**已完成（1-11, 14）：**
- ✅ 创建事件表单已更新新字段（QualityEventList.vue）
- ✅ 后端 API 已更新支持新字段

**剩余任务：**
1. 任务12: P阶段添加"变更"勾选框及弹窗功能
2. 任务13: A阶段增加"原因类型"多选
3. 任务15: "问题描述"支持上传图片和附件
4. 任务16: 更新数据库表结构（添加新字段）
5. 任务17: 更新后端 API 接口（如果需要）
6. 任务18: 更新详情页显示新字段
7. 任务19: 更新P阶段、A阶段编辑功能
8. 任务20: 测试所有功能

## 执行计划

### Phase 1: 数据库和后端基础（任务16-17）
1. 创建数据库迁移脚本 - 添加新字段
   - product_stage, product_type, project_no, customer
   - keywords, problem_type
   - severity（改为支持多选存储）
   - related_parts, discovery_form
   - responsible_ids（JSON数组）
   - supervisor_id, supervisor_name
   - is_changed（变更标记）
   - change_source_id（变更来源事件ID）
   - cause_type（原因类型）

2. 运行数据库迁移

### Phase 2: 详情页显示（任务18）
3. 更新 QualityEventDetail.vue 基本信息区域
   - 显示产品阶段、产品类型、项目号/生产任务单号
   - 显示用户、关键字、问题类型
   - 显示故障严重程度（多选解析）
   - 显示涉及相关部件（多选解析）
   - 显示问题发现/提出形式（多选解析）
   - 显示监督/确认人

### Phase 3: P阶段变更功能（任务12）
4. 在 QualityEventDetail.vue Plan 阶段添加：
   - "变更"勾选框
   - 勾选后弹出新建事件对话框
   - 弹窗内预填充当前事件数据
   - 描述栏默认添加"此事件由xx号事件变更而来"
   - 确认后创建新事件，取消后恢复未勾选状态

### Phase 4: A阶段原因类型（任务13）
5. 在 QualityEventDetail.vue Act 阶段添加：
   - "原因类型"多选字段
   - 编辑 Act 时的表单更新

### Phase 5: 问题描述附件（任务15）
6. 在创建事件表单中添加问题描述附件上传
7. 在详情页显示问题描述附件

### Phase 6: 测试（任务20）
8. 全面测试所有功能

## 任务依赖关系

```
Phase 1 (数据库) → Phase 2 (详情页显示)
                        ↓
              Phase 3 (P阶段变更) → Phase 4 (A阶段原因类型)
                        ↓
              Phase 5 (描述附件) → Phase 6 (测试)
```

## 启动命令

现在开始执行 Phase 1...