<template>
  <div class="procedures">
    <!-- 列表视图 -->
    <div v-if="!showDetail">
      <!-- 统计卡片 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stat-card c-class">
            <div class="stat-content">
              <div class="stat-icon">C</div>
              <div class="stat-info">
                <div class="stat-value">{{ categoryCount.C || 0 }}</div>
                <div class="stat-label">程序文件</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card m-class">
            <div class="stat-content">
              <div class="stat-icon">M</div>
              <div class="stat-info">
                <div class="stat-value">{{ categoryCount.M || 0 }}</div>
                <div class="stat-label">管理文件</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card s-class">
            <div class="stat-content">
              <div class="stat-icon">S</div>
              <div class="stat-info">
                <div class="stat-value">{{ categoryCount.S || 0 }}</div>
                <div class="stat-label">支持文件</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 筛选栏 -->
      <el-card class="filter-card">
        <div class="filter-header">
          <el-form :inline="true" :model="searchForm">
            <el-form-item label="文件分类">
              <el-select v-model="searchForm.category" placeholder="全部分类" clearable @change="handleSearch">
                <el-option label="C-程序文件" value="C" />
                <el-option label="M-管理文件" value="M" />
                <el-option label="S-支持文件" value="S" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="编制部门">
              <el-select v-model="searchForm.department" placeholder="全部部门" clearable @change="handleSearch">
                <el-option 
                  v-for="dept in departments" 
                  :key="dept" 
                  :label="dept" 
                  :value="dept" 
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="文件编号/名称" 
                clearable
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          
          <div class="filter-actions">
            <el-tag type="info" size="large" effect="plain">
              {{ appStore.currentYear }}年度
            </el-tag>
            <el-button 
              v-if="userStore.userInfo?.role === 'admin'" 
              type="warning" 
              @click="showArchiveDialog"
            >
              <el-icon><FolderChecked /></el-icon> 年度归档
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 程序文件列表 -->
      <el-card class="procedure-list">
        <template #header>
          <div class="card-header">
            <span>程序文件列表</span>
          </div>
        </template>

        <el-table :data="procedureList" v-loading="loading" stripe @row-click="viewDetail">
          <el-table-column type="index" label="序号" width="60" />
          
          <el-table-column label="分类" width="80">
            <template #default="{ row }">
              <el-tag :type="getCategoryType(row.category)">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="groupSort" label="分组排序" width="90" sortable>
            <template #default="{ row }">
              <el-tag :type="getCategoryType(row.category)" size="small">{{ row.groupSort }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="fileCode" label="文件编号" width="150" />
          
          <el-table-column prop="fileName" label="文件名称" min-width="200" />
          
          <el-table-column label="KO项" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isKo === 1 || row.isKo === true" type="danger" size="small" effect="dark">KO</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="department" label="编制部门" width="120" />
          
          <el-table-column prop="responsiblePerson" label="负责人" width="100" />
          
          <el-table-column label="记录进度" width="150">
            <template #default="{ row }">
              <el-progress 
                v-if="row.recordCount > 0"
                :percentage="Math.round((row.uploadedCount / row.recordCount) * 100)" 
                :status="row.uploadedCount === row.recordCount ? 'success' : ''"
              />
              <span v-else>无记录</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click.stop="viewDetail(row)">进入</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 详情视图 -->
    <div v-else class="detail-view">
      <!-- 返回按钮 -->
      <div class="back-nav">
        <el-button link @click="backToList">
          <el-icon><ArrowLeft /></el-icon>返回列表
        </el-button>
      </div>

      <!-- 文件基本信息 -->
      <el-card>
        <template #header>
          <div class="detail-header">
            <span>{{ currentProcedure.fileName }}</span>
            <el-tag :type="getCategoryType(currentProcedure.category)">{{ currentProcedure.category }}</el-tag>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件编号">{{ currentProcedure.fileCode }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ currentProcedure.version }}</el-descriptions-item>
          <el-descriptions-item label="文件分类">
            <el-tag :type="getCategoryType(currentProcedure.category)">{{ currentProcedure.category }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分组排序">
            <el-tag :type="getCategoryType(currentProcedure.category)" size="small">{{ currentProcedure.groupSort }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="KO项">
            <el-tag v-if="currentProcedure.isKo === 1 || currentProcedure.isKo === true" type="danger" effect="dark">是</el-tag>
            <span v-else>否</span>
          </el-descriptions-item>
          <el-descriptions-item label="编制部门">{{ currentProcedure.department }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentProcedure.responsiblePerson }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 人员信息 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <span>相关人员</span>
        </template>
        
        <el-table :data="currentProcedure.persons" stripe size="small">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="personName" label="姓名" />
          <el-table-column prop="personRole" label="角色" />
          <el-table-column prop="department" label="部门" />
        </el-table>
      </el-card>

      <!-- 需要编制的记录 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>需要编制的记录</span>
            <el-button type="primary" size="small" @click="showAddRecordDialog">添加记录</el-button>
          </div>
        </template>
        
        <el-empty v-if="!currentProcedure.records || currentProcedure.records.length === 0" description="暂无记录" />
        
        <el-table v-else :data="currentProcedure.records" stripe size="small">
          <el-table-column type="index" label="序号" width="60" />
          
          <el-table-column prop="recordNumber" label="记录编号" width="120" />
          
          <el-table-column prop="recordName" label="记录名称" />
          
          <el-table-column prop="description" label="说明" />
          
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'UPLOADED' ? 'success' : 'warning'">
                {{ row.status === 'UPLOADED' ? '已上传' : '待上传' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="row.status !== 'UPLOADED'" 
                type="primary" 
                size="small" 
                @click="showUploadDialog(row)"
              >
                上传文件
              </el-button>
              <template v-else>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="previewFile(row)"
                >
                  预览
                </el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="downloadFile(row)"
                >
                  下载
                </el-button>
              </template>
              <el-button type="danger" size="small" @click="deleteRecord(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传记录文件" width="500px">
      <el-form label-width="100px">
        <el-form-item label="记录名称">
          <span>{{ currentRecord?.recordName }}</span>
        </el-form-item>
        
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF/Word/Excel 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <!-- 添加记录对话框 -->
    <el-dialog v-model="addRecordDialogVisible" title="添加记录" width="500px">
      <el-form :model="recordForm" label-width="100px">
        <el-form-item label="记录编号">
          <el-input v-model="recordForm.recordNumber" placeholder="请输入记录编号" readonly />
        </el-form-item>
        
        <el-form-item label="记录名称">
          <el-input v-model="recordForm.recordName" placeholder="请输入记录名称" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="recordForm.description" type="textarea" :rows="3" placeholder="请输入说明" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addRecordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addRecord" :loading="adding">确定</el-button>
      </template>
    </el-dialog>

    <!-- 归档对话框 -->
    <el-dialog v-model="archiveDialogVisible" title="年度文件归档" width="500px">
      <el-alert
        :title="`将对 ${appStore.currentYear} 年度的所有已上传文件进行归档`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />
      <el-form :model="archiveForm" label-width="80px">
        <el-form-item label="归档备注">
          <el-input v-model="archiveForm.remark" type="textarea" :rows="3" placeholder="请输入归档备注（可选）" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="archiveDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleArchive" :loading="archiving">确认归档</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { procedureApi, api } from '@/api'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const loading = ref(false)
const uploading = ref(false)
const adding = ref(false)
const archiving = ref(false)
const showDetail = ref(false)
const uploadDialogVisible = ref(false)
const addRecordDialogVisible = ref(false)
const archiveDialogVisible = ref(false)

const searchForm = reactive({
  category: '',
  department: '',
  keyword: ''
})

const procedureList = ref([])
const departments = ref([])
const currentProcedure = ref({})
const currentRecord = ref(null)
const selectedFile = ref(null)

const recordForm = reactive({
  recordNumber: '',
  recordName: '',
  description: ''
})

const categoryCount = computed(() => {
  const count = { C: 0, M: 0, S: 0 }
  procedureList.value.forEach(p => {
    if (count[p.category] !== undefined) {
      count[p.category]++
    }
  })
  return count
})

const fetchProcedures = async () => {
  loading.value = true
  try {
    const res = await procedureApi.getList({
      category: searchForm.category,
      department: searchForm.department,
      keyword: searchForm.keyword,
      year: appStore.currentYear
    })
    procedureList.value = res.data || []
  } catch (error) {
    console.error('获取程序文件列表失败:', error)
    ElMessage.error('获取程序文件列表失败')
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await procedureApi.getDepartments({ year: appStore.currentYear })
    departments.value = res.data || []
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const viewDetail = async (row) => {
  try {
    const res = await procedureApi.getDetail(row.id, { year: appStore.currentYear })
    currentProcedure.value = res.data || {}
    showDetail.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

const backToList = () => {
  showDetail.value = false
  currentProcedure.value = {}
}

const handleSearch = () => {
  fetchProcedures()
}

const getCategoryType = (category) => {
  const map = { 'C': 'primary', 'M': 'success', 'S': 'warning' }
  return map[category] || 'info'
}

const showAddRecordDialog = async () => {
  // 先刷新程序文件详情，获取最新记录列表
  if (currentProcedure.value?.id) {
    await viewDetail({ id: currentProcedure.value.id })
  }
  
  // 自动生成记录编号：YYYYMMDD-001格式
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  // 统计当前程序文件当天的记录数
  const todayRecords = currentProcedure.value.records?.filter(r => {
    const recordDate = r.createdAt?.slice(0, 10).replace(/-/g, '')
    return recordDate === dateStr
  }) || []
  
  const sequence = String(todayRecords.length + 1).padStart(3, '0')
  recordForm.recordNumber = `${dateStr}-${sequence}`
  
  recordForm.recordName = ''
  recordForm.description = ''
  addRecordDialogVisible.value = true
}

const addRecord = async () => {
  if (!recordForm.recordName) {
    ElMessage.warning('请输入记录名称')
    return
  }
  
  adding.value = true
  try {
    await procedureApi.createRecord({
      procedureFileId: currentProcedure.value.id,
      recordNumber: recordForm.recordNumber,
      recordName: recordForm.recordName,
      description: recordForm.description,
      year: appStore.currentYear
    })
    ElMessage.success('记录添加成功')
    addRecordDialogVisible.value = false
    viewDetail(currentProcedure.value)
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    adding.value = false
  }
}

const showUploadDialog = (row) => {
  currentRecord.value = row
  selectedFile.value = null
  uploadDialogVisible.value = true
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  
  uploading.value = true
  try {
    // 上传文件，传递 procedureFileId 和 recordId
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('procedureFileId', currentProcedure.value.id)
    formData.append('recordId', currentRecord.value.id)
    
    const uploadRes = await procedureApi.upload(formData)
    
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    viewDetail(currentProcedure.value)
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const downloadFile = (row) => {
  if (row.filePath) {
    window.open(row.filePath, '_blank')
  }
}

const previewFile = async (row) => {
  if (!row.filePath) {
    ElMessage.warning('文件路径不存在')
    return
  }
  
  const ext = row.filePath.split('.').pop().toLowerCase()
  
  // PDF 直接浏览器打开预览
  if (ext === 'pdf') {
    window.open(row.filePath, '_blank')
    return
  }
  
  // Office 文件使用 OnlyOffice 预览
  const officeExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  if (officeExts.includes(ext)) {
    // 打开 OnlyOffice 预览页面
    const previewUrl = `/onlyoffice-preview/${row.id}`
    window.open(previewUrl, '_blank')
    return
  }
  
  ElMessage.warning('该文件类型不支持在线预览')
}

const deleteRecord = (row) => {
  ElMessageBox.confirm('确定要删除该记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await procedureApi.deleteRecord(row.id)
      ElMessage.success('删除成功')
      viewDetail(currentProcedure.value)
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

// 显示归档对话框
const archiveForm = reactive({
  remark: ''
})

const showArchiveDialog = () => {
  archiveForm.remark = ''
  archiveDialogVisible.value = true
}

// 执行归档
const handleArchive = async () => {
  archiving.value = true
  try {
    const res = await procedureApi.archive({
      year: appStore.currentYear
    })
    if (res.code === 200) {
      ElMessage.success(`${appStore.currentYear}年度文件归档完成，共归档 ${res.data.fileCount} 个文件`)
      archiveDialogVisible.value = false
      
      // 自动下载归档文件
      const downloadUrl = res.data.downloadUrl
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = res.data.zipFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('归档失败:', error)
    ElMessage.error('归档失败')
  } finally {
    archiving.value = false
  }
}

onMounted(() => {
  fetchProcedures()
  fetchDepartments()
})

// 监听路由变化，当点击菜单返回时重置到列表视图
watch(() => route.query._t, (newVal) => {
  if (newVal) {
    showDetail.value = false
    currentProcedure.value = {}
    // 重新获取数据
    fetchProcedures()
    fetchDepartments()
  }
})

// 监听年份变化，自动刷新数据
watch(() => appStore.currentYear, (newYear, oldYear) => {
  if (newYear !== oldYear) {
    fetchProcedures()
    fetchDepartments()
    // 如果在详情页，返回列表页
    showDetail.value = false
    currentProcedure.value = {}
  }
})
</script>

<style scoped>
.procedures {
  padding: 0;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
    color: #fff;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.c-class .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.m-class .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.s-class .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.filter-card {
  margin-top: 20px;
  margin-bottom: 20px;

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
  }

  .filter-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.procedure-list {
  cursor: pointer;
}

.back-nav {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-view {
  .el-card {
    margin-bottom: 20px;
  }
}
</style>
