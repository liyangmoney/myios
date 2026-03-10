<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>PIS绩效指标管理系统</h1>
        <p>ISO 22163 体系管理平台</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <p v-if="errorMsg" style="color: #f56c6c; margin-top: 10px;">{{ errorMsg }}</p>
        <p style="color: #909399; margin-top: 10px; font-size: 12px;">
          当前服务器: {{ serverUrl }}
          <el-button type="primary" link size="small" @click="showServerConfig = true">修改</el-button>
        </p>
      </div>
    </div>
    
    <!-- 服务器配置对话框 -->
    <el-dialog
      v-model="showServerConfig"
      title="服务器配置"
      width="90%"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="tempServerUrl"
            placeholder="http://myjghy.myds.me:9090/api"
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
              <p>• 修改后需要重新登录</p>
            </div>
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="showServerConfig = false">取消</el-button>
        <el-button type="primary" @click="saveServerConfig">保存并重启</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import apiConfig from '@/api/config'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const serverUrl = ref(apiConfig.baseURL)
const showServerConfig = ref(false)
const tempServerUrl = ref(apiConfig.baseURL)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const saveServerConfig = () => {
  if (!tempServerUrl.value) {
    ElMessage.error('请输入服务器地址')
    return
  }
  
  localStorage.setItem('api_config', JSON.stringify({
    baseURL: tempServerUrl.value
  }))
  
  ElMessage.success('配置已保存，即将重启应用')
  showServerConfig.value = false
  
  setTimeout(() => {
    window.location.reload()
  }, 1500)
}

const handleLogin = async () => {
  errorMsg.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    console.log('正在登录:', loginForm.username)
    console.log('使用服务器:', apiConfig.baseURL)
    
    // 清除旧的 token
    localStorage.removeItem('token')
    
    // 使用完整 URL 发送登录请求
    const loginUrl = apiConfig.baseURL + '/auth/login'
    console.log('请求地址:', loginUrl)
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: loginForm.username,
        password: loginForm.password
      })
    })
    
    const res = await response.json()
    console.log('登录响应:', res)
    
    if (res.code === 200 && res.data?.token) {
      // 保存 token
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
      
      ElMessage.success('登录成功')
      
      // 跳转到首页
      router.push('/')
    } else {
      errorMsg.value = res.message || '登录失败'
      ElMessage.error(res.message || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    errorMsg.value = '登录失败，请检查网络连接。当前服务器: ' + apiConfig.baseURL
    ElMessage.error('登录失败，无法连接到服务器')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('Login page mounted, apiConfig:', apiConfig)
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
}

.login-tips {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}
</style>
