import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 移动端适配样式
import './styles/mobile.css'

import App from './App.vue'
import router from './router'

// 抑制 ResizeObserver 循环错误（非致命）
const originalError = window.console.error
window.console.error = (...args) => {
  const errorMsg = args[0]?.toString?.() || ''
  if (errorMsg.includes('ResizeObserver loop completed with undelivered notifications')) {
    return
  }
  originalError.apply(window.console, args)
}

// 检查 token 是否过期
const checkTokenExpiration = () => {
  const token = localStorage.getItem('token')
  if (!token) return
  
  try {
    // 解析 JWT payload
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    
    const payload = JSON.parse(jsonPayload)
    const exp = payload.exp * 1000 // 转换为毫秒
    const now = Date.now()
    
    // 如果 token 已过期或将在 1 小时内过期，清除 token
    if (exp < now) {
      console.log('[Token] Token expired, clearing...')
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (exp - now < 60 * 60 * 1000) {
      console.log('[Token] Token will expire in less than 1 hour')
    }
  } catch (error) {
    console.error('[Token] Failed to parse token:', error)
  }
}

// 应用启动时检查 token
checkTokenExpiration()

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
