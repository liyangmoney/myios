<template>
  <div class="quality-event">
    <div class="page-header">
      <h2>质量事件监管</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新建事件
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="28"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.new || 0 }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="28"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.processing || 0 }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="28"><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.checking || 0 }}</div>
              <div class="stat-label">验证中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.closed || 0 }}</div>
              <div class="stat-label">已关闭</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="编号/标题"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="新建" value="NEW" />
            <el-option label="计划中" value="PLAN" />
            <el-option label="执行中" value="DO" />
            <el-option label="验证中" value="CHECK" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="searchForm.severity" placeholder="全部" clearable style="width: 120px">
            <el-option label="轻微" value="轻微">
              <el-tag type="info" size="small">轻微</el-tag>
            </el-option>
            <el-option label="一般" value="一般">
              <el-tag type="warning" size="small">一般</el-tag>
            </el-option>
            <el-option label="严重" value="严重">
              <el-tag type="danger" size="small">严重</el-tag>
            </el-option>
            <el-option label="致命" value="致命">
              <el-tag type="danger" size="small" effect="dark">致命</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="我的事件">
          <el-checkbox v-model="searchForm.myEvents">仅显示我创建/负责的</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 事件列表 -->
    <el-card class="table-card">
      <el-table :data="eventList" v-loading="loading" stripe @row-click="handleRowClick">
        <el-table-column prop="event_no" label="事件编号" width="130">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="viewDetail(row)">{{ row.event_no }}</el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="responsible_name" label="责任人" width="100" />
        
        <el-table-column prop="current_handler_name" label="当前处理人" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.current_handler_name" type="primary" size="small">
              {{ row.current_handler_name }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="reporter_name" label="创建人" width="100" />
        
        <el-table-column prop="due_date" label="截止日期" width="140">
          <template #default="{ row }">
            <span :class="{ 'overdue': isOverdue(row.due_date, row.status) }">
              {{ row.due_date ? formatDateTime(row.due_date).split(' ')[0] : '-' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.reporter_id === currentUserId" 
              link type="danger" 
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑事件对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑质量事件' : '新建质量事件'" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入事件标题" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="事件类型" prop="eventType">
              <el-select v-model="formData.eventType" placeholder="请选择" style="width: 100%">
                <el-option label="内部不符合" value="内部不符合" />
                <el-option label="外部不符合" value="外部不符合" />
                <el-option label="审核发现" value="审核发现" />
                <el-option label="过程异常" value="过程异常" />
                <el-option label="设备异常" value="设备异常" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重程度" prop="severity">
              <el-select v-model="formData.severity" placeholder="请选择" style="width: 100%">
                <el-option label="轻微" value="轻微" />
                <el-option label="一般" value="一般" />
                <el-option label="严重" value="严重" />
                <el-option label="致命" value="致命" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="责任人">
              <el-select-v2
                v-model="formData.responsibleId"
                :options="userOptions"
                placeholder="请选择责任人"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="formData.dueDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="问题描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="4"
            placeholder="请详细描述问题情况..."
          />
        </el-form-item>
        
        <el-form-item label="通知人">
          <el-select-v2
            v-model="formData.notifyUsers"
            :options="userOptions"
            placeholder="选择通知人（可多选）"
            style="width: 100%"
            multiple
            clearable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { qualityEventApi, userApi } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

// 统计数据
const stats = ref({
  new: 0,
  processing: 0,
  checking: 0,
  closed: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  severity: '',
  myEvents: false
})

// 事件列表
const eventList = ref([])
const userOptions = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const submitting = ref(false)
const formData = reactive({
  id: null,
  title: '',
  eventType: '',
  severity: '',
  responsibleId: null,
  dueDate: '',
  description: '',
  notifyUsers: []
})

const formRules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

// 获取事件列表
const fetchEventList = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      status: searchForm.status,
      severity: searchForm.severity,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.myEvents) {
      params.reporterId = currentUserId.value
    }
    
    const res = await qualityEventApi.getList(params)
    if (res.code === 200) {
      eventList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取事件列表失败:', error)
    ElMessage.error('获取事件列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await qualityEventApi.getStatistics()
    if (res.code === 200) {
      const statusStats = res.data.byStatus
      stats.value = {
        new: statusStats.find(s => s.status === 'NEW')?.count || 0,
        processing: (statusStats.find(s => s.status === 'PLAN')?.count || 0) + 
                   (statusStats.find(s => s.status === 'DO')?.count || 0),
        checking: statusStats.find(s => s.status === 'CHECK')?.count || 0,
        closed: statusStats.find(s => s.status === 'CLOSED')?.count || 0
      }
    }
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取用户列表
const fetchUserList = async () => {
  try {
    const res = await userApi.getList({ pageSize: 1000 })
    if (res.code === 200) {
      userOptions.value = res.data.list.map(user => ({
        label: `${user.user_name} (${user.username})`,
        value: user.id
      }))
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchEventList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.severity = ''
  searchForm.myEvents = false
  pagination.page = 1
  fetchEventList()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchEventList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchEventList()
}

// 显示新建对话框
const showCreateDialog = () => {
  isEdit.value = false
  formData.id = null
  formData.title = ''
  formData.eventType = ''
  formData.severity = ''
  formData.responsibleId = null
  formData.dueDate = ''
  formData.description = ''
  formData.notifyUsers = []
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      title: formData.title,
      eventType: formData.eventType,
      severity: formData.severity,
      responsibleId: formData.responsibleId,
      dueDate: formData.dueDate,
      description: formData.description,
      notifyUsers: formData.notifyUsers
    }
    
    if (isEdit.value) {
      await qualityEventApi.update(formData.id, data)
      ElMessage.success('更新成功')
    } else {
      await qualityEventApi.create(data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchEventList()
    fetchStatistics()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

// 查看详情
const viewDetail = (row) => {
  router.push(`/quality-events/${row.id}`)
}

const handleRowClick = (row) => {
  viewDetail(row)
}

// 删除事件
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除事件 "${row.event_no}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await qualityEventApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchEventList()
    fetchStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取严重程度样式
const getSeverityType = (severity) => {
  const types = {
    '轻微': 'info',
    '一般': 'warning',
    '严重': 'danger',
    '致命': 'danger'
  }
  return types[severity] || ''
}

// 获取状态标签
const getStatusLabel = (status) => {
  const labels = {
    NEW: '新建',
    PLAN: '计划中',
    DO: '执行中',
    CHECK: '验证中',
    CLOSED: '已关闭',
    REJECTED: '已驳回'
  }
  return labels[status] || status
}

// 获取状态样式
const getStatusType = (status) => {
  const types = {
    NEW: 'danger',
    PLAN: 'warning',
    DO: 'primary',
    CHECK: 'info',
    CLOSED: 'success',
    REJECTED: 'info'
  }
  return types[status] || ''
}

// 判断是否逾期
const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'CLOSED') return false
  return new Date(dueDate) < new Date()
}

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}`
}

onMounted(() => {
  fetchEventList()
  fetchStatistics()
  fetchUserList()
})
</script>

<style scoped>
.quality-event {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.stat-card {
  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
