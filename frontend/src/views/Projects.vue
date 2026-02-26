<template>
  <div class="projects">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" clearable />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="searchForm.projectType" placeholder="请选择" clearable>
            <el-option label="ISO22163" value="ISO22163" />
            <el-option label="ISO9001" value="ISO9001" />
            <el-option label="EPPPS" value="EPPPS" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 项目列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>项目列表</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>新建项目
          </el-button>
        </div>
      </template>

      <el-table :data="projectList" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="projectCode" label="项目编号" width="150" />
        
        <el-table-column prop="projectName" label="项目名称" />
        
        <el-table-column prop="projectType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.projectType }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="responsibleUserName" label="负责人" width="120" />
        
        <el-table-column label="时间范围" width="200">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }} ~ {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        
        <el-table-column label="达标率" width="180">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.achievementRate || 0" 
              :status="getProgressStatus(row.achievementRate)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看</el-button>
            <el-button type="primary" link @click="editProject(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteProject(row)">删除</el-button>
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

    <!-- 新建/编辑项目对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑项目' : '新建项目'"
      width="700px"
    >
      <el-form :model="projectForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="projectForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目类型" prop="projectType">
          <el-select v-model="projectForm.projectType" placeholder="请选择项目类型">
            <el-option label="ISO22163" value="ISO22163" />
            <el-option label="ISO9001" value="ISO9001" />
            <el-option label="EPPPS" value="EPPPS" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围" prop="dateRange">
          <el-date-picker
            v-model="projectForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="responsibleUserId">
          <el-select v-model="projectForm.responsibleUserId" placeholder="请选择负责人">
            <el-option 
              v-for="user in userList" 
              :key="user.id" 
              :label="user.userName" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目成员">
          <el-select v-model="projectForm.members" multiple placeholder="请选择成员">
            <el-option 
              v-for="user in userList" 
              :key="user.id" 
              :label="user.userName" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input 
            v-model="projectForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProject" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { projectApi, userApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const searchForm = reactive({
  projectName: '',
  projectType: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const projectForm = reactive({
  id: null,
  projectName: '',
  projectType: '',
  dateRange: [],
  responsibleUserId: null,
  members: [],
  description: ''
})

const rules = {
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }],
  responsibleUserId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

const projectList = ref([])
const userList = ref([])

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const getProgressStatus = (rate) => {
  if (!rate) return ''
  if (rate >= 90) return 'success'
  if (rate >= 70) return ''
  return 'exception'
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await projectApi.getList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    projectList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('获取项目列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const res = await userApi.getList()
    userList.value = res.data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchProjects()
}

const resetSearch = () => {
  searchForm.projectName = ''
  searchForm.projectType = ''
  handleSearch()
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editProject = (row) => {
  isEdit.value = true
  Object.assign(projectForm, {
    id: row.id,
    projectName: row.projectName,
    projectType: row.projectType,
    dateRange: [row.startDate, row.endDate],
    responsibleUserId: row.responsibleUserId,
    members: row.members?.map(m => m.userId) || [],
    description: row.description
  })
  dialogVisible.value = true
}

const resetForm = () => {
  projectForm.id = null
  projectForm.projectName = ''
  projectForm.projectType = ''
  projectForm.dateRange = []
  projectForm.responsibleUserId = null
  projectForm.members = []
  projectForm.description = ''
  formRef.value?.resetFields()
}

const submitProject = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      projectName: projectForm.projectName,
      projectType: projectForm.projectType,
      startDate: projectForm.dateRange[0],
      endDate: projectForm.dateRange[1],
      responsibleUserId: projectForm.responsibleUserId,
      members: projectForm.members.map(userId => ({ userId, role: '成员' })),
      description: projectForm.description
    }

    if (isEdit.value) {
      await projectApi.update(projectForm.id, data)
      ElMessage.success('项目更新成功')
    } else {
      await projectApi.create(data)
      ElMessage.success('项目创建成功')
    }
    
    dialogVisible.value = false
    fetchProjects()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const deleteProject = (row) => {
  ElMessageBox.confirm('确定要删除该项目吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await projectApi.delete(row.id)
      ElMessage.success('删除成功')
      fetchProjects()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const viewDetail = (row) => {
  router.push(`/projects/${row.id}`)
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchProjects()
}

const handlePageChange = (val) => {
  pagination.page = val
  fetchProjects()
}

onMounted(() => {
  fetchProjects()
  fetchUsers()
})
</script>

<style scoped>
.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
