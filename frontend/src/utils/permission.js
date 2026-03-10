// 权限管理工具

// 检查并请求存储权限
export const requestStoragePermission = async () => {
  // 网页端不需要申请权限
  if (typeof window === 'undefined' || !window.Capacitor) {
    return true
  }
  
  try {
    // 动态导入 Capacitor 插件
    const { Permissions } = await import('@capacitor/core')
    
    // 检查当前权限状态
    const result = await Permissions.query({
      name: 'storage'
    })
    
    if (result.state === 'granted') {
      return true
    }
    
    // 申请权限
    const requestResult = await Permissions.request({
      name: 'storage'
    })
    
    return requestResult.state === 'granted'
  } catch (error) {
    console.error('申请权限失败:', error)
    // 如果权限 API 不可用，默认允许
    return true
  }
}

// 检查是否在 APP 环境
export const isApp = () => {
  return typeof window !== 'undefined' && window.Capacitor !== undefined
}
