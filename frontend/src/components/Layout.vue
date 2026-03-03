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
        <el-menu-item index="/quality-events">
          <el-icon><Warning /></el-icon>
          <span>质量事件</span>
        </el-menu-item>
        <el-menu-item 
          v-if="userStore.userInfo?.role === 'admin'" 
          index="/users"
        >
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item 
          v-if="userStore.userInfo?.role === 'admin'" 
          index="/operation-logs"
        >
          <el-icon><Document /></el-icon>
          <span>操作记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header" v-if="!isMobile">
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
                <el-dropdown-item command="changePassword">
                  <el-icon><Lock /></el-icon> 修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content" :class="{ 'mobile-main': isMobile }">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordDialogVisible"
      title="修改密码"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="100px"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input
            v-model="changePasswordForm.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="changePasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="changePasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="changePasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="changePasswordLoading">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 移动端底部导航 -->
    <div v-if="isMobile" class="mobile-bottom-nav">
      <div 
        v-for="item in mobileNavItems" 
        :key="item.path"
        class="mobile-nav-item"
        :class="{ active: $route.path === item.path }"
        @click="$router.push(item.path)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { procedureApi, userApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMobile } from '@/composables/useMobile'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
const isMobile = useMobile()

const availableYears = ref([])

// 移动端导航项
const mobileNavItems = [
  { path: '/dashboard', label: '首页', icon: 'DataLine' },
  { path: '/procedures', label: '程序文件', icon: 'Document' },
  { path: '/quality-events', label: '质量事件', icon: 'Warning' },
  { path: '/reports', label: '报表', icon: 'DocumentCopy' }
]

// 修改密码相关
const changePasswordDialogVisible = ref(false)
const changePasswordFormRef = ref(null)
const changePasswordLoading = ref(false)
const changePasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 确认密码验证
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== changePasswordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const changePasswordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

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

// 打开修改密码对话框
const openChangePasswordDialog = () => {
  changePasswordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  changePasswordDialogVisible.value = true
}

// 提交修改密码
const handleChangePassword = async () => {
  const valid = await changePasswordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  changePasswordLoading.value = true
  try {
    const res = await userApi.changePassword(userStore.userInfo?.id, {
      oldPassword: changePasswordForm.value.oldPassword,
      newPassword: changePasswordForm.value.newPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      changePasswordDialogVisible.value = false
      // 修改密码后退出登录
      setTimeout(() => {
        userStore.logout()
        router.push('/login')
      }, 1500)
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.message || '修改密码失败')
  } finally {
    changePasswordLoading.value = false
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    await userStore.logout()
    router.push('/login')
  } else if (command === 'changePassword') {
    openChangePasswordDialog()
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

.main-content.mobile-main {
  padding-bottom: 70px;
}

/* 移动端底部导航 */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #909399;
  font-size: 10px;
  cursor: pointer;
  transition: color 0.3s;
}

.mobile-nav-item .el-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.mobile-nav-item.active {
  color: #409eff;
}

.mobile-nav-item:active {
  opacity: 0.7;
}

/* 移动端侧边栏隐藏 */
@media screen and (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>