<template>
  <div class="procedure-documents">
    <!-- 统计卡片 - PC端 -->
    <el-row :gutter="20" class="pc-only">
      <el-col :span="8">
        <el-card class="stat-card c-class">
          <div class="stat-content">
            <div class="stat-icon">C</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.C || 0 }}</div>
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
              <div class="stat-value">{{ stats.M || 0 }}</div>
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
              <div class="stat-value">{{ stats.S || 0 }}</div>
              <div class="stat-label">支持文件</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计卡片 - 移动端 -->
    <div class="stats-grid mobile-only">
      <el-card class="stat-card c-class">
        <div class="stat-content">
          <div class="stat-icon">C</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.C || 0 }}</div>
            <div class="stat-label">程序文件</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card m-class">
        <div class="stat-content">
          <div class="stat-icon">M</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.M || 0 }}</div>
            <div class="stat-label">管理文件</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card s-class">
        <div class="stat-content">
          <div class="stat-icon">S</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.S || 0 }}</div>
            <div class="stat-label">支持文件</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选栏 - PC端 -->
    <el-card class="filter-card pc-only">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="文件分类">
          <el-select v-model="searchForm.categoryCode" placeholder="全部分类" clearable @change="handleSearch">
            <el-option label="C-程序文件" value="C" />
            <el-option label="M-管理文件" value="M" />
            <el-option label="S-支持文件" value="S" />
          </el-select>
        </el-form-item>

        <el-form-item label="主责部门">
          <el-select v-model="searchForm.department" placeholder="全部部门" clearable @change="handleSearch">
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部" clearable @change="handleSearch">
            <el-option label="P0-KO项" value="P0" />
            <el-option label="P1-重要" value="P1" />
            <el-option label="P2-一般" value="P2" />
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
    </el-card>

    <!-- 筛选栏 - 移动端 -->
    <el-card class="filter-card mobile-only">
      <div class="mobile-filter">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索文件编号/名称"
          clearable
          @keyup.enter="handleSearch"
          class="mobile-search-input"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        
        <div class="mobile-filter-row">
          <el-select v-model="searchForm.categoryCode" placeholder="分类" clearable size="small" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="C-程序" value="C" />
            <el-option label="M-管理" value="M" />
            <el-option label="S-支持" value="S" />
          </el-select>
          
          <el-select v-model="searchForm.department" placeholder="部门" clearable size="small" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
          
          <el-select v-model="searchForm.priority" placeholder="优先级" clearable size="small" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="P0" value="P0" />
            <el-option label="P1" value="P1" />
            <el-option label="P2" value="P2" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 文件列表 - PC端表格 -->
    <el-card class="document-list pc-only">
      <template #header>
        <div class="card-header">
          <span>42个体系文件列表</span>
          <el-button type="primary" @click="showImportDialog">
            <el-icon><Upload /></el-icon>批量上传
          </el-button>
        </div>
      </template>

      <el-empty v-if="groupedDocuments.length === 0 && !loading" description="暂无数据" />

      <div v-for="group in groupedDocuments" :key="group.category" class="document-group">
        <div class="group-header">
          <span class="category-badge" :class="'badge-' + group.category">{{ group.category }}</span>
          <span class="category-name">{{ group.categoryName }}</span>
          <span class="group-count">共 {{ group.documents.length }} 个文件</span>
        </div>

        <el-table :data="group.documents" stripe border size="small">
          <el-table-column type="index" label="序号" width="60" align="center" >
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>

          <el-table-column prop="documentCode" label="文件编号" width="150" />

          <el-table-column prop="documentName" label="文件名称" min-width="250" />

          <el-table-column prop="department" label="主责部门" width="120" />

          <el-table-column prop="priority" label="优先级" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ row.priority }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="version" label="版本" width="80" align="center" />

          <el-table-column label="文件状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="!row.filePath"
                type="primary"
                link
                @click="showUploadDialog(row)"
              >
                上传
              </el-button>
              <el-button
                v-else
                type="success"
                link
                @click="downloadFile(row)"
              >
                下载
              </el-button>
              <el-button type="primary" link @click="showEditDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 文件列表 - 移动端卡片 -->
    <div class="mobile-list mobile-only">
      <div class="mobile-list-header">
        <span>42个体系文件列表</span>
        <el-button type="primary" size="small" @click="showImportDialog">
          <el-icon><Upload /></el-icon>批量上传
        </el-button>
      </div>
      
      <el-empty v-if="groupedDocuments.length === 0 && !loading" description="暂无数据" />
      
      <div v-for="group in groupedDocuments" :key="group.category" class="mobile-group">
        <div class="mobile-group-header">
          <span class="category-badge" :class="'badge-' + group.category">{{ group.category }}</span>
          <span class="category-name">{{ group.categoryName }}</span>
          <span class="group-count">共 {{ group.documents.length }} 个</span>
        </div>
        
        <div class="mobile-document-cards">
          <div 
            v-for="(doc, index) in group.documents" 
            :key="doc.id" 
            class="mobile-doc-card"
          >
            <div class="mobile-doc-header">
              <span class="mobile-doc-index">{{ index + 1 }}</span>
              <span class="mobile-doc-code">{{ doc.documentCode }}</span>
            </div>
            
            <div class="mobile-doc-name">{{ doc.documentName }}</div>
            
            <div class="mobile-doc-tags">
              <el-tag :type="getPriorityType(doc.priority)" size="small">{{ doc.priority }}</el-tag>
              <el-tag :type="getStatusType(doc.status)" size="small">{{ getStatusText(doc.status) }}</el-tag>
            </div>
            
            <div class="mobile-doc-info">
              <span>部门：{{ doc.department }}</span>
              <span>版本：{{ doc.version }}</span>
            </div>
            
            <div class="mobile-doc-actions">
              <el-button
                v-if="!doc.filePath"
                type="primary"
                size="small"
                @click="showUploadDialog(doc)"
              >
                上传
              </el-button>
              <el-button
                v-else
                type="success"
                size="small"
                @click="downloadFile(doc)"
              >
                下载
              </el-button>
              <el-button type="primary" size="small" @click="showEditDialog(doc)">编辑</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传体系文件" width="500px">
      <el-form label-width="100px">
        <el-form-item label="文件编号">
          <span>{{ currentDocument?.documentCode }}</span>
        </el-form-item>
        <el-form-item label="文件名称">
          <span>{{ currentDocument?.documentName }}</span>
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
              <div class="el-upload__tip">支持 PDF/Word/Excel 格式，最大 50MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { procedureDocumentApi } from '@/api'

const documents = ref([])
const departments = ref([])
const loading = ref(false)
const uploading = ref(false)
const uploadDialogVisible = ref(false)
const currentDocument = ref(null)
const selectedFile = ref(null)

const searchForm = reactive({
  categoryCode: '',
  department: '',
  priority: '',
  keyword: ''
})

const stats = reactive({
  C: 0,
  M: 0,
  S: 0
})

// 按分类分组
const groupedDocuments = computed(() => {
  const groups = {}

  documents.value.forEach(doc => {
    if (!groups[doc.categoryCode]) {
      groups[doc.categoryCode] = {
        category: doc.categoryCode,
        categoryName: doc.categoryName || doc.categoryCode,
        documents: []
      }
    }
    groups[doc.categoryCode].documents.push(doc)
  })

  // 按 C, M, S 顺序返回
  const result = []
  if (groups.C) result.push(groups.C)
  if (groups.M) result.push(groups.M)
  if (groups.S) result.push(groups.S)

  console.log('Grouped Documents:', result) // 调试输出
  return result
})

const fetchDocuments = async () => {
  loading.value = true
  try {
    const res = await procedureDocumentApi.getList({
      categoryCode: searchForm.categoryCode,
      department: searchForm.department,
      priority: searchForm.priority,
      keyword: searchForm.keyword,
      pageSize: 100
    })

    console.log('API Response:', res) // 调试输出

    documents.value = res.data?.list || []
    console.log('Documents:', documents.value) // 调试输出

    // 更新统计
    const statsData = res.data?.stats || []
    statsData.forEach(item => {
      stats[item.categoryCode] = item.count
    })
    console.log('Stats:', stats) // 调试输出
  } catch (error) {
    console.error('获取文件列表失败:', error)
    ElMessage.error('获取文件列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await procedureDocumentApi.getDepartments()
    departments.value = res.data || []
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const handleSearch = () => {
  fetchDocuments()
}

const getPriorityType = (priority) => {
  const map = { 'P0': 'danger', 'P1': 'warning', 'P2': 'info' }
  return map[priority] || 'info'
}

const getStatusType = (status) => {
  const map = { 'ACTIVE': 'success', 'REVISION': 'warning', 'OBSOLETE': 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 'ACTIVE': '有效', 'REVISION': '修订中', 'OBSOLETE': '废止' }
  return map[status] || status
}

const showUploadDialog = (row) => {
  currentDocument.value = row
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
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('documentId', currentDocument.value.id)

    await procedureDocumentApi.upload(formData)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    fetchDocuments()
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const downloadFile = (row) => {
  if (row.filePath) {
    window.open(`${row.filePath}`, '_blank')
  }
}

const showEditDialog = (row) => {
  ElMessage.info('编辑功能开发中...')
}

const showImportDialog = () => {
  ElMessage.info('批量导入功能开发中...')
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    fetchDocuments()
    fetchDepartments()
  }
})
</script>

<style scoped>
.procedure-documents {
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-group {
  margin-bottom: 30px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.category-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.badge-C {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.badge-M {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.badge-S {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.category-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.group-count {
  margin-left: auto;
  font-size: 14px;
  color: #909399;
}

.document-list {
  margin-top: 20px;
}

/* 移动端适配 */
.mobile-only {
  display: none;
}

.pc-only {
  display: block;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.mobile-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-search-input {
  width: 100%;
}

.mobile-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mobile-filter-row .el-select {
  flex: 1;
  min-width: 80px;
}

/* 移动端列表 */
.mobile-list {
  margin-bottom: 20px;
}

.mobile-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
}

.mobile-group {
  margin-bottom: 15px;
}

.mobile-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f5f7fa;
  font-size: 14px;
}

.mobile-document-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 15px;
  background: #fff;
}

.mobile-doc-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
}

.mobile-doc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mobile-doc-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}

.mobile-doc-code {
  font-family: monospace;
  font-size: 13px;
  color: #409eff;
}

.mobile-doc-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
  line-height: 1.4;
}

.mobile-doc-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.mobile-doc-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
}

.mobile-doc-actions {
  display: flex;
  gap: 8px;
}

@media screen and (max-width: 768px) {
  .pc-only {
    display: none !important;
  }
  
  .mobile-only {
    display: block !important;
  }
  
  .procedure-documents {
    padding: 10px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .stat-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .stat-content {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  .filter-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .document-list :deep(.el-card__body) {
    padding: 0;
  }
  
  .card-header {
    padding: 12px 15px;
  }
  
  .group-header {
    padding: 10px 15px;
  }
}
</style>
