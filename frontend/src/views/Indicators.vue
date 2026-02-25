<template>
  <div class="indicators">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>指标填报</span>
          <el-select v-model="selectedProject" placeholder="选择项目" style="width: 200px">
            <el-option 
              v-for="project in projects" 
              :key="project.id" 
              :label="project.projectName" 
              :value="project.id" 
            />
          </el-select>
        </div>
      </template>

      <el-empty v-if="!selectedProject" description="请选择项目" />
      
      <div v-else>
        <el-table :data="indicators" v-loading="loading" stripe>
          <el-table-column type="index" width="50" />
          <el-table-column prop="indicatorName" label="指标名称" />
          <el-table-column prop="weight" label="权重" width="80">
            <template #default="{ row }">
              {{ row.weight }}%
            </template>
          </el-table-column>
          
          <el-table-column label="目标值" width="120">
            <template #default="{ row }">
              {{ formatTarget(row) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="actualValue" label="实际值" width="120">
            <template #default="{ row }">
              <span v-if="row.actualValue" class="value-reported">{{ row.actualValue }}</span>
              <span v-else class="value-pending">--</span>
            </template>
          </el-table-column>
          
          <el-table-column label="达标率" width="120">
            <template #default="{ row }">
              <el-tag 
                v-if="row.achievementRate" 
                :type="getAchievementTagType(row.achievementRate)"
              >
                {{ row.achievementRate }}%
              </el-tag>
              <span v-else>--</span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="openReportDialog(row)">
                {{ row.status === 'REPORTED' ? '修改' : '填报' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 填报对话框 -->
    <el-dialog v-model="dialogVisible" title="指标填报" width="500px">
      <el-form :model="reportForm" label-width="100px">
        <el-form-item label="指标名称">
          <span>{{ currentIndicator?.indicatorName }}</span>
        </el-form-item>
        
        <el-form-item label="目标值">
          <span>{{ formatTarget(currentIndicator) }}</span>
        </el-form-item>
        
        <el-form-item label="实际值">
          <el-input v-model="reportForm.actualValue" placeholder="请输入实际值">
            <template #append v-if="currentIndicator?.unit">
              {{ currentIndicator.unit }}
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="证据说明">
          <el-input 
            v-model="reportForm.evidenceDescription" 
            type="textarea" 
            :rows="3"
            placeholder="请输入证据说明"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { projectApi, indicatorApi } from '@/api'

const selectedProject = ref('')
const projects = ref([])
const indicators = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const currentIndicator = ref(null)

const reportForm = reactive({
  actualValue: '',
  evidenceDescription: ''
})

// 获取项目列表
const fetchProjects = async () => {
  try {
    const res = await projectApi.getList({ pageSize: 100 })
    projects.value = res.data?.list || []
  } catch (error) {
    console.error('获取项目列表失败:', error)
  }
}

// 获取指标列表
const fetchIndicators = async () => {
  if (!selectedProject.value) return
  
  loading.value = true
  try {
    const res = await indicatorApi.getByProject(selectedProject.value)
    indicators.value = res.data || []
  } catch (error) {
    console.error('获取指标列表失败:', error)
  } finally {
    loading.value = false
  }
}

const formatTarget = (row) => {
  if (!row) return '--'
  switch (row.targetType) {
    case 'GE': return `≥${row.targetValue}`
    case 'LE': return `≤${row.targetValue}`
    case 'RANGE': return `${row.targetMin}-${row.targetMax}`
    default: return row.targetValue
  }
}

const getAchievementTagType = (rate) => {
  if (rate >= 100) return 'success'
  if (rate >= 70) return 'warning'
  return 'danger'
}

const getStatusType = (status) => {
  const map = { 'PENDING': 'info', 'REPORTED': 'success', 'APPROVED': 'primary' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 'PENDING': '待填报', 'REPORTED': '已填报', 'APPROVED': '已审核' }
  return map[status] || status
}

const openReportDialog = (row) => {
  currentIndicator.value = row
  reportForm.actualValue = row.actualValue || ''
  reportForm.evidenceDescription = ''
  dialogVisible.value = true
}

const submitReport = async () => {
  if (!reportForm.actualValue) {
    ElMessage.warning('请输入实际值')
    return
  }
  
  submitting.value = true
  try {
    await indicatorApi.submitRecord(currentIndicator.value.id, {
      actualValue: reportForm.actualValue,
      evidenceDescription: reportForm.evidenceDescription
    })
    ElMessage.success('填报成功')
    dialogVisible.value = false
    fetchIndicators()
  } catch (error) {
    ElMessage.error('填报失败')
  } finally {
    submitting.value = false
  }
}

watch(selectedProject, fetchIndicators)

fetchProjects()
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-reported {
  color: #67C23A;
  font-weight: bold;
}

.value-pending {
  color: #909399;
}
</style>
