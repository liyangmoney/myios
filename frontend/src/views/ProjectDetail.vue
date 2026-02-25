<template>
  <div class="project-detail" v-loading="loading">
    <!-- 返回按钮 -->
    <div class="back-nav">
      <el-button link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回列表
      </el-button>
    </div>

    <!-- 项目信息 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目详情</span>
          <el-button type="primary" @click="editMode = !editMode">{{ editMode ? '取消' : '编辑' }}</el-button>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目编号">{{ project.projectCode }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ project.projectName }}</el-descriptions-item>
        <el-descriptions-item label="项目类型">
          <el-tag>{{ project.projectType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ project.responsibleUserName }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ formatDate(project.startDate) }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ formatDate(project.endDate) }}</el-descriptions-item>
        <el-descriptions-item label="项目描述" :span="2">{{ project.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="achievement-section" v-if="project.achievementRate">
        <h3>整体达标率</h3>
        <div class="achievement-display">
          <el-progress 
            type="dashboard" 
            :percentage="project.achievementRate?.weightedAchievementRate || 0"
            :color="getAchievementColor"
            :stroke-width="10"
          />
          <div class="achievement-stats">
            <p>指标总数：{{ project.achievementRate?.totalIndicators || 0 }}</p>
            <p>已达标：{{ project.achievementRate?.achievedCount || 0 }}</p>
            <p>加权达标率：{{ project.achievementRate?.weightedAchievementRate || 0 }}%</p>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 指标列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>PIS指标列表</span>
      </template>

      <el-table :data="indicators" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column prop="indicatorName" label="指标名称" />
        <el-table-column prop="weight" label="权重" width="80">
          <template #default="{ row }">{{ row.weight }}%</template>
        </el-table-column>
        <el-table-column label="目标值" width="100">
          <template #default="{ row }">{{ formatTarget(row) }}</template>
        </el-table-column>
        <el-table-column prop="actualValue" label="实际值" width="100">
          <template #default="{ row }">{{ row.actualValue || '-' }}</template>
        </el-table-column>
        <el-table-column label="达标率" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.achievementRate" :type="getAchievementType(row.achievementRate)">
              {{ row.achievementRate }}%
            </el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { projectApi } from '@/api'

const route = useRoute()
const loading = ref(false)
const editMode = ref(false)
const project = ref({})
const indicators = ref([])

const fetchProjectDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  loading.value = true
  try {
    const res = await projectApi.getDetail(id)
    project.value = res.data || {}
    indicators.value = res.data?.achievementRate?.indicators || []
  } catch (error) {
    console.error('获取项目详情失败:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const formatTarget = (row) => {
  if (!row) return '-'
  switch (row.targetType) {
    case 'GE': return `≥${row.targetValue}`
    case 'LE': return `≤${row.targetValue}`
    case 'RANGE': return `${row.targetMin}-${row.targetMax}`
    default: return row.targetValue
  }
}

const getAchievementType = (rate) => {
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

const getAchievementColor = (percentage) => {
  if (percentage >= 90) return '#67C23A'
  if (percentage >= 70) return '#E6A23C'
  return '#F56C6C'
}

onMounted(fetchProjectDetail)
</script>

<style scoped>
.back-nav {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-section {
  margin-top: 30px;
  text-align: center;
}

.achievement-section h3 {
  margin-bottom: 20px;
  color: #303133;
}

.achievement-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.achievement-stats {
  text-align: left;
}

.achievement-stats p {
  margin: 8px 0;
  color: #606266;
}
</style>
