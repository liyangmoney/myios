<template>
  <div class="mobile-layout">
    <!-- 顶部标题栏 -->
    <div class="mobile-header">
      <div class="mobile-header-left">
        <slot name="left">
          <span class="mobile-logo">PIS系统</span>
        </slot>
      </div>
      <div class="mobile-header-title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="mobile-header-right">
        <slot name="right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </slot>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="mobile-content">
      <slot></sslot>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="mobile-bottom-nav">
      <div 
        v-for="item in navItems" 
        :key="item.path"
        class="nav-item"
        :class="{ active: $route.path === item.path }"
        @click="$router.push(item.path)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  HomeFilled, 
  Document, 
  WarningFilled,
  User 
} from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 底部导航项
const navItems = [
  { path: '/', label: '首页', icon: 'HomeFilled' },
  { path: '/procedures', label: '程序文件', icon: 'Document' },
  { path: '/quality-events', label: '质量事件', icon: 'WarningFilled' },
  { path: '/profile', label: '我的', icon: 'User' }
]

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      // 触发修改密码事件
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch {
        // 取消退出
      }
      break
  }
}
</script>

<style scoped>
.mobile-layout {
  min-height: 100vh;
  padding-bottom: 60px;
  background: #f5f7fa;
}

.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  z-index: 1000;
}

.mobile-header-left {
  flex: 0 0 60px;
}

.mobile-logo {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.mobile-header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.mobile-header-right {
  flex: 0 0 60px;
  text-align: right;
}

.user-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #606266;
}

.mobile-content {
  padding-top: 50px;
  min-height: calc(100vh - 110px);
}

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

.nav-item {
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

.nav-item .el-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.nav-item.active {
  color: #409eff;
}

.nav-item:active {
  opacity: 0.7;
}
</style>
