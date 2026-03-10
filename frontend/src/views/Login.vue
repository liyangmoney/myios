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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { CapacitorHttp } from '@capacitor/core'
import apiConfig from '@/api/config'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  errorMsg.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    console.log('正在登录:', loginForm.username)
    console.log('服务器地址:', apiConfig.baseURL)
    
    // 清除旧的 token
    localStorage.removeItem('token')
    
    // 使用完整的 API 地址
    const loginUrl = apiConfig.baseURL + '/auth/login'
    console.log('登录URL:', loginUrl)
    
    // 使用 Capacitor HTTP
    const response = await CapacitorHttp.post({
      url: loginUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        username: loginForm.username,
        password: loginForm.password
      }
    })
    
    console.log('登录响应:', response)
    const res = response.data
    
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
    errorMsg.value = '连接失败: ' + (error.message || '网络错误') + '，地址: ' + apiConfig.baseURL
    ElMessage.error('无法连接到服务器')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
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

@media screen and (max-width: 480px) {
  .login-box {
    width: 100%;
    max-width: 350px;
    padding: 30px 20px;
  }
}
</style>
