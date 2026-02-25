<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="32"><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalProjects }}</div>
              <div class="stat-label">项目总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.achievedProjects }}</div>
              <div class="stat-label">达标项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="32"><EditPen /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingIndicators }}</div>
              <div class="stat-label">待填报指标</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.avgAchievementRate }}%</div>
              <div class="stat-label">平均达标率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 达标率趋势图 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>达标率趋势</span>
          </template>
          <div ref="trendChart" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>项目达标分布</span>
          </template>
          <div ref="pieChart" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近项目 -->
    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>最近项目</span>
            <el-button type="primary" link @click="$router.push('/projects')">查看更多</el-button>
          </template>
          <el-table :data="recentProjects" stripe>
            <el-table-column prop="projectName" label="项目名称" />
            <el-table-column prop="projectType" label="类型" width="120" />
            <el-table-column prop="responsibleUser" label="负责人" width="120" />
            <el-table-column label="达标率" width="180">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.achievementRate" 
                  :status="getProgressStatus(row.achievementRate)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewProject(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { projectApi } from '@/api'

const router = useRouter()
const trendChart = ref(null)
const pieChart = ref(null)

const stats = ref({
  totalProjects: 12,
  achievedProjects: 8,
  pendingIndicators: 15,
  avgAchievementRate: 87.5
})

const recentProjects = ref([
  { id: 1, projectName: 'ISO22163体系建设', projectType: 'ISO22163', responsibleUser: '张三', achievementRate: 92 },
  { id: 2, projectName: '质量管理体系优化', projectType: 'ISO9001', responsibleUser: '李四', achievementRate: 85 },
  { id: 3, projectName: '供应商管理提升', projectType: 'EPPPS', responsibleUser: '王五', achievementRate: 100 },
  { id: 4, projectName: '设计流程标准化', projectType: 'ISO22163', responsibleUser: '赵六', achievementRate: 78 }
])

const getProgressStatus = (rate) => {
  if (rate >= 90) return 'success'
  if (rate >= 70) return ''
  return 'exception'
}

const viewProject = (id) => {
  router.push(`/projects/${id}`)
}

const initTrendChart = () => {
  const chart = echarts.init(trendChart.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      data: [75, 80, 82, 85, 87, 87.5],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      },
      itemStyle: { color: '#409EFF' }
    }]
  })
}

const initPieChart = () => {
  const chart = echarts.init(pieChart.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      data: [
        { value: 8, name: '达标(≥90%)', itemStyle: { color: '#67C23A' } },
        { value: 3, name: '良好(70-89%)', itemStyle: { color: '#E6A23C' } },
        { value: 1, name: '待改进(<70%)', itemStyle: { color: '#F56C6C' } }
      ]
    }]
  })
}

onMounted(() => {
  initTrendChart()
  initPieChart()
})
</script>

<style scoped>
.stat-card {
  .stat-item {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
