<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h2>PIS系统</h2>
      </div>
      
      <!-- 年份选择器 -->
      <div class="year-selector">
        <el-select 
          v-model="appStore.currentYear" 
          @change="handleYearChange"
          size="small"
          class="year-select"
        >
          <el-option 
            v-for="year in availableYears" 
            :key="year" 
            :label="year + '年度'" 
            :value="year"
          />
        </el-select>
      </div>
      
      <el-menu
        :default-active="$route.path"
        router
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>首页看板</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/indicators">
          <el-icon><EditPen /></el-icon>
          <span>指标填报</span>
        </el-menu-item>
        <el-menu-item index="/procedures" @click="navigateToProcedures">
          <el-icon><Document /></el-icon>
          <span>程序文件</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DocumentCopy /></el-icon>
          <span>报表中心</span>
        </el-menu-item>
        <el-menu-item 
          v-if="userStore.userInfo?.role === 'admin'" 
          index="/users"
        >
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-right">
          <span class="current-year-tag">{{ appStore.currentYear }}年度</span>
          
          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" class="user-avatar" />
              <div class="user-details">
                <span class="user-name">{{ userStore.userInfo?.userName || '用户' }}</span>
                <span class="user-role">{{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}</span>
              </div>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <div style="padding: 5px 0;">
                    <div style="font-weight: bold;">{{ userStore.userInfo?.userName }}</div>
                    <div style="font-size: 12px; color: #909399;">{{ userStore.userInfo?.username }}</div>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { procedureApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const availableYears = ref([])

// 组件挂载时从 localStorage 加载用户信息
onMounted(() => {
  // 加载用户信息
  if (!userStore.userInfo) {
    const savedUserInfo = localStorage.getItem('userInfo')
    console.log('从 localStorage 加载用户信息:', savedUserInfo)
    if (savedUserInfo) {
      try {
        const parsed = JSON.parse(savedUserInfo)
        console.log('解析后的用户信息:', parsed)
        userStore.setUserInfo(parsed)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  } else {
    console.log('userStore 已有用户信息:', userStore.userInfo)
  }
  
  // 加载年份列表
  fetchAvailableYears()
})

// 获取可用年份列表
const fetchAvailableYears = async () => {
  try {
    const res = await procedureApi.getYears()
    if (res.code === 200) {
      availableYears.value = res.data
      // 如果没有当前年份，添加它
      const currentYear = new Date().getFullYear()
      if (!availableYears.value.includes(currentYear)) {
        availableYears.value.unshift(currentYear)
      }
      // 确保年份降序排列
      availableYears.value.sort((a, b) => b - a)
    }
  } catch (error) {
    console.error('获取年份列表失败:', error)
    // 默认显示当前年份和前后几年
    const currentYear = new Date().getFullYear()
    availableYears.value = [currentYear + 1, currentYear, currentYear - 1]
  }
}

// 年份切换
const handleYearChange = async (year) => {
  appStore.setCurrentYear(year)
  ElMessage.success(`已切换到 ${year} 年度`)
  
  // 检查该年度是否有数据
  try {
    const res = await procedureApi.getList({ year, pageSize: 1 })
    const hasData = res.data && res.data.length > 0
    
    if (!hasData && year > new Date().getFullYear() - 5) {
      // 新年份没有数据，询问是否复制上一年度
      const prevYear = year - 1
      
      ElMessageBox.confirm(
        `${year} 年度暂无数据，是否从 ${prevYear} 年度复制程序文件？`,
        '年度数据初始化',
        {
          confirmButtonText: '复制上一年度',
          cancelButtonText: '暂不复制',
          type: 'info'
        }
      ).then(async () => {
        // 执行复制
        const copyRes = await procedureApi.copyYear({
          sourceYear: prevYear,
          targetYear: year
        })
        
        if (copyRes.code === 200) {
          ElMessage.success(`成功复制 ${copyRes.data.copiedFileCount} 个程序文件`)
        }
      }).catch(() => {
        // 用户取消，不做任何操作
      })
    }
  } catch (error) {
    console.error('检查年度数据失败:', error)
  }
  
  // 刷新当前页面
  router.replace({
    path: route.path,
    query: { ...route.query, _t: Date.now() }
  })
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

// 导航到程序文件列表页（强制刷新）
const navigateToProcedures = () => {
  // 使用 replace 并添加时间戳参数强制刷新
  router.replace({
    path: '/procedures',
    query: { _t: Date.now() }
  })
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
  margin: 0;
  font-size: 20px;
}

.year-selector {
  padding: 10px 15px;
  border-bottom: 1px solid #1f2d3d;
}

.year-select {
  width: 100%;
}

:deep(.year-select .el-input__wrapper) {
  background-color: #1f2d3d;
}

:deep(.year-select .el-input__inner) {
  color: #bfcbd9;
  text-align: center;
}

.el-menu-vertical {
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-year-tag {
  font-size: 14px;
  color: #409EFF;
  font-weight: 500;
  padding: 4px 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 16px;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

.dropdown-icon {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.main-content {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}
</style>