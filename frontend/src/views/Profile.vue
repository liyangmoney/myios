<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="avatar-section">
        <el-avatar :size="80" :icon="UserFilled" class="user-avatar" />
        <div class="user-name">{{ userStore.userInfo?.userName || '用户' }}</div>
        <div class="user-role">{{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}</div>
      </div>
    </div>
    
    <div class="profile-content">
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>账号信息</span>
          </div>
        </template>
        <div class="info-item">
          <span class="label">用户名</span>
          <span class="value">{{ userStore.userInfo?.username || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">显示名称</span>
          <span class="value">{{ userStore.userInfo?.userName || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">角色</span>
          <el-tag :type="userStore.userInfo?.role === 'admin' ? 'danger' : 'info'" size="small">
            {{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </div>
      </el-card>
      
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>服务器配置</span>
            <el-button type="primary" link @click="openServerConfigDialog">修改</el-button>
          </div>
        </template>
        <div class="info-item">
          <span class="label">当前服务器</span>
          <span class="value" style="font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{ currentServer }}</span>
        </div>
        <div class="info-item">
          <span class="label">运行环境</span>
          <el-tag size="small">{{ isCapacitor ? 'APP' : '浏览器' }}</el-tag>
        </div>
      </el-card>
      
      <div class="action-section">
        <el-button type="primary" size="large" class="action-btn" @click="openChangePasswordDialog">
          <el-icon><Lock /></el-icon>
          修改密码
        </el-button>
        <el-button type="danger" size="large" class="action-btn" plain @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordDialogVisible"
      title="修改密码"
      width="90%"
      :close-on-click-modal="false"
      class="mobile-dialog"
    >
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="80px"
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
    
    <!-- 服务器配置对话框 -->
    <el-dialog
      v-model="serverConfigDialogVisible"
      title="服务器配置"
      width="90%"
      :close-on-click-modal="false"
      class="mobile-dialog"
    >
      <el-form label-width="100px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="serverConfig.baseURL"
            placeholder="http://192.168.1.100:9090/api"
          />
        </el-form-item>
        
        <el-alert
          title="配置说明"
          type="info"
          :closable="false"
          style="margin-bottom: 15px;"
        >
          <template #default>
            <div style="font-size: 12px;">
              <p>• 请填写完整的后端服务器地址</p>
              <p>• 例如：http://192.168.1.100:9090/api</p>
              <p>• 修改后需要重新登录才能生效</p>
            </div>
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="serverConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveServerConfig">保存并重启</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Lock, SwitchButton } from '@element-plus/icons-vue'
import apiConfig from '@/api/config'

const router = useRouter()
const userStore = useUserStore()

// 检测是否在 Capacitor 环境中
const isCapacitor = ref(false)
const currentServer = ref(apiConfig.baseURL)

// 加载用户信息
onMounted(() => {
  // 检测运行环境
  isCapacitor.value = typeof window.Capacitor !== 'undefined'
  
  if (!userStore.userInfo) {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userStore.setUserInfo(JSON.parse(savedUserInfo))
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }
})

// 服务器配置相关
const serverConfigDialogVisible = ref(false)
const serverConfig = ref({
  baseURL: apiConfig.baseURL
})

const openServerConfigDialog = () => {
  serverConfig.value.baseURL = apiConfig.baseURL
  serverConfigDialogVisible.value = true
}

const saveServerConfig = () => {
  if (!serverConfig.value.baseURL) {
    ElMessage.error('请输入服务器地址')
    return
  }
  
  // 保存配置
  localStorage.setItem('api_config', JSON.stringify({
    baseURL: serverConfig.value.baseURL
  }))
  
  ElMessage.success('配置已保存，即将重启应用')
  serverConfigDialogVisible.value = false
  
  // 延迟刷新页面
  setTimeout(() => {
    window.location.reload()
  }, 1500)
}

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

const openChangePasswordDialog = () => {
  changePasswordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  changePasswordDialogVisible.value = true
}

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

// 退出登录
const handleLogout = async () => {
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
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  text-align: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar {
  background: #fff;
  color: #667eea;
  font-size: 40px;
}

.user-name {
  margin-top: 15px;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.user-role {
  margin-top: 5px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.profile-content {
  padding: 20px;
  padding-bottom: 80px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  color: #303133;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #606266;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-btn {
  width: 100%;
  justify-content: center;
}

.action-btn .el-icon {
  margin-right: 8px;
}
</style>
