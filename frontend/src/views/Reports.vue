<template>
  <div class="reports">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value" style="color: #409EFF;">{{ summary.totalProjects }}</div>
            <div class="stat-label">项目总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value" style="color: #67C23A;">{{ summary.achievedProjects }}</div>
            <div class="stat-label">达标项目</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value" style="color: #E6A23C;">{{ summary.totalIndicators }}</div>
            <div class="stat-label">指标总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-value" style="color: #F56C6C;">{{ summary.avgAchievementRate }}%</div>
            <div class="stat-label">平均达标率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目达标率排名 -->
    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>项目达标率排名</span>
            <el-button type="primary" link @click="exportReport">
              <el-icon><Download /></el-icon>导出报告
            </el-button>
          </template>
          
          <el-table :data="projectRanking" stripe>
            <el-table-column type="index" label="排名" width="80" />
            <el-table-column prop="projectName" label="项目名称" />
            <el-table-column prop="projectType" label="类型" width="120" />
            <el-table-column prop="responsibleUserName" label="负责人" width="120" />
            <el-table-column label="达标率" width="200">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.achievementRate || 0" 
                  :status="getProgressStatus(row.achievementRate)"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.achievementRate >= 90 ? 'success' : 'warning'">
                  {{ row.achievementRate >= 90 ? '达标' : '未达标' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { projectApi } from '@/api'

const summary = reactive({
  totalProjects: 0,
  achievedProjects: 0,
  totalIndicators: 0,
  avgAchievementRate: 0
})

const projectRanking = ref([])

const fetchReportData = async () => {
  try {
    const res = await projectApi.getList({ pageSize: 100 })
    const projects = res.data?.list || []
    
    summary.totalProjects = projects.length
    summary.achievedProjects = projects.filter(p => (p.achievementRate || 0) >= 90).length
    summary.avgAchievementRate = projects.length > 0 
      ? (projects.reduce((sum, p) => sum + (p.achievementRate || 0), 0) / projects.length).toFixed(2)
      : 0
    
    // 按达标率排序
    projectRanking.value = [...projects].sort((a, b) => 
      (b.achievementRate || 0) - (a.achievementRate || 0)
    )
  } catch (error) {
    console.error('获取报表数据失败:', error)
  }
}

const getProgressStatus = (rate) => {
  if (!rate) return ''
  if (rate >= 90) return 'success'
  if (rate >= 70) return ''
  return 'exception'
}

const exportReport = () => {
  // 简单导出 CSV
  const headers = ['排名', '项目名称', '类型', '负责人', '达标率', '状态']
  const rows = projectRanking.value.map((p, index) => [
    index + 1,
    p.projectName,
    p.projectType,
    p.responsibleUserName,
    p.achievementRate + '%',
    p.achievementRate >= 90 ? '达标' : '未达标'
  ])
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `PIS报表_${new Date().toLocaleDateString()}.csv`
  link.click()
  
  ElMessage.success('导出成功')
}

onMounted(fetchReportData)
</script>

<style scoped>
.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>
