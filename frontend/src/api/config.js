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
  if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
    return { baseURL: envUrl }
  }
  return {}
}

// 默认配置
const defaultConfig = {
  baseURL: '/api'
}

// 获取各种配置
const storedConfig = getStoredConfig()
const envConfig = getEnvConfig()

console.log('[API Config] Stored config:', storedConfig)
console.log('[API Config] Env config:', envConfig)

// 合并配置：默认配置 + 本地存储配置 + 环境变量配置（优先级最高）
const finalConfig = {
  ...defaultConfig,
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
