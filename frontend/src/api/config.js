// API 配置文件
// 修改此文件以配置后端服务器地址

// 读取本地存储的自定义配置
const getStoredConfig = () => {
  const customConfig = localStorage.getItem('api_config')
  if (customConfig) {
    try {
      return JSON.parse(customConfig)
    } catch (e) {
      console.error('Invalid api_config in localStorage')
    }
  }
  return {}
}

// 从环境变量读取（构建时注入）
const getEnvConfig = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  console.log('[API Config] VITE_API_BASE_URL from env:', envUrl)
  if (envUrl) {
    return { baseURL: envUrl }
  }
  return {}
}

const config = {
  // 开发环境
  development: {
    // 默认使用本地代理，如需直接访问后端请修改
    baseURL: '/api'
  },
  
  // 生产环境（构建后的网页或 APK）
  production: {
    // 默认服务器地址，可在 Profile 页面修改
    baseURL: 'http://localhost:9090/api'
  }
}

// 根据环境获取配置
const env = import.meta.env.MODE || 'development'
const storedConfig = getStoredConfig()
const envConfig = getEnvConfig()

console.log('[API Config] Environment:', env)
console.log('[API Config] Env config:', envConfig)
console.log('[API Config] Stored config:', storedConfig)

// 合并配置：默认配置 + 本地存储配置 + 环境变量配置（环境变量优先级最高）
const finalConfig = {
  ...config[env],
  ...storedConfig,
  ...envConfig
}

console.log('[API Config] Final baseURL:', finalConfig.baseURL)

export default finalConfig

// 导出函数用于动态修改配置
export const setApiConfig = (newConfig) => {
  localStorage.setItem('api_config', JSON.stringify(newConfig))
  // 刷新页面使配置生效
  window.location.reload()
}

// 清除本地配置（用于重置）
export const clearApiConfig = () => {
  localStorage.removeItem('api_config')
  window.location.reload()
}
