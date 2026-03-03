<template>
  <div class="dashboard">
    <!-- PC端布局 -->
    <template v-if="!isMobile">
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
    </template>

    <!-- 移动端布局 -->
    <template v-else>
      <div class="mobile-stats">
        <div class="mobile-stat-card">
          <div class="stat-icon" style="background: #409EFF"><el-icon size="24"><Folder /></el-icon></div>
          <div class="stat-value">{{ stats.totalProjects }}</div>
          <div class="stat-label">项目总数</div>
        </div>
        <div class="mobile-stat-card">
          <div class="stat-icon" style="background: #67C23A"><el-icon size="24"><CircleCheck /></el-icon></div>
          <div class="stat-value">{{ stats.achievedProjects }}</div>
          <div class="stat-label">达标项目</div>
        </div>
        <div class="mobile-stat-card">
          <div class="stat-icon" style="background: #E6A23C"><el-icon size="24"><EditPen /></el-icon></div>
          <div class="stat-value">{{ stats.pendingIndicators }}</div>
          <div class="stat-label">待填报</div>
        </div>
        <div class="mobile-stat-card">
          <div class="stat-icon" style="background: #F56C6C"><el-icon size="24"><TrendCharts /></el-icon></div>
          <div class="stat-value">{{ stats.avgAchievementRate }}%</div>
          <div class="stat-label">达标率</div>
        </div>
      </div>
    </template>

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
import { useMobile } from '@/composables/useMobile'

const router = useRouter()
const isMobile = useMobile()
const trendChart = ref(null)
const pieChart = ref(null)

const stats = ref({
  totalProjects: 0,
  achievedProjects: 0,
  pendingIndicators: 0,
  avgAchievementRate: 0
})

const recentProjects = ref([])

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

/* 移动端样式 */
@media screen and (max-width: 768px) {
  .mobile-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .mobile-stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .mobile-stat-card .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 8px;
  }
  
  .mobile-stat-card .stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #303133;
  }
  
  .mobile-stat-card .stat-label {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
