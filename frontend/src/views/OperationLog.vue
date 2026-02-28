<template>
  <div class="operation-log">
    <div class="page-header">
      <h2>操作记录</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="用户名/操作描述"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="全部模块" clearable>
            <el-option 
              v-for="mod in moduleList" 
              :key="mod" 
              :label="mod" 
              :value="mod"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action" placeholder="全部类型" clearable>
            <el-option label="创建" value="CREATE" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="登录" value="LOGIN" />
            <el-option label="登出" value="LOGOUT" />
            <el-option label="归档" value="ARCHIVE" />
            <el-option label="复制" value="COPY" />
            <el-option label="上传" value="UPLOAD" />
            <el-option label="评论" value="COMMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作日志列表 -->
    <el-card class="table-card">
      <el-table :data="logList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="created_at" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="user_name" label="姓名" width="100" />
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="操作详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(currentLog.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog.user_name }} ({{ currentLog.username }})
        </el-descriptions-item>
        <el-descriptions-item label="模块">
          {{ currentLog.module }}
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          {{ getActionLabel(currentLog.action) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作描述">
          {{ currentLog.description }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentLog.ip_address }}
        </el-descriptions-item>
        <el-descriptions-item label="浏览器信息">
          {{ currentLog.user_agent }}
        </el-descriptions-item>
        <el-descriptions-item label="请求数据">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ formatJson(currentLog.request_data) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应数据">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ formatJson(currentLog.response_data) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="currentLog.error_msg">
          <span style="color: #f56c6c;">{{ currentLog.error_msg }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { operationLogApi } from '@/api'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  module: '',
  action: '',
  timeRange: []
})

// 日志列表
const logList = ref([])
const moduleList = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentLog = ref({})

// 获取日志列表
const fetchLogList = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      module: searchForm.module,
      action: searchForm.action,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.startTime = searchForm.timeRange[0] + ' 00:00:00'
      params.endTime = searchForm.timeRange[1] + ' 23:59:59'
    }
    
    const res = await operationLogApi.getList(params)
    if (res.code === 200) {
      logList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取操作日志失败:', error)
    ElMessage.error('获取操作日志失败')
  } finally {
    loading.value = false
  }
}

// 获取模块列表
const fetchModuleList = async () => {
  try {
    const res = await operationLogApi.getModules()
    if (res.code === 200) {
      moduleList.value = res.data
    }
  } catch (error) {
    console.error('获取模块列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchLogList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.module = ''
  searchForm.action = ''
  searchForm.timeRange = []
  pagination.page = 1
  fetchLogList()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchLogList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchLogList()
}

// 显示详情
const showDetail = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

// 获取操作类型标签
const getActionLabel = (action) => {
  const labels = {
    CREATE: '创建',
    UPDATE: '修改',
    DELETE: '删除',
    LOGIN: '登录',
    LOGOUT: '登出',
    ARCHIVE: '归档',
    COPY: '复制',
    UPLOAD: '上传',
    COMMENT: '评论'
  }
  return labels[action] || action
}

// 获取操作类型样式
const getActionType = (action) => {
  const types = {
    CREATE: 'success',
    UPDATE: 'primary',
    DELETE: 'danger',
    LOGIN: 'info',
    LOGOUT: 'info',
    ARCHIVE: 'warning',
    COPY: 'warning',
    UPLOAD: 'success',
    COMMENT: 'info'
  }
  return types[action] || ''
}

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化 JSON
const formatJson = (json) => {
  if (!json) return '-'
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

onMounted(() => {
  fetchLogList()
  fetchModuleList()
})
</script>

<style scoped>
.operation-log {
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

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
