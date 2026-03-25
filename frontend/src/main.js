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

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
