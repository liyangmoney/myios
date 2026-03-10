// APP 版本检查和更新提示
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Browser } from '@capacitor/browser'
import apiConfig from '@/api/config'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.0.0'

/**
 * 检查 APP 版本
 * 从服务器获取最新版本号，如果有新版本则提示用户
 */
export const checkAppVersion = async () => {
  // 只在 APP 环境中检查
  if (!Capacitor.isNativePlatform()) {
    return
  }
  
  try {
    const response = await fetch(`${apiConfig.baseURL}/app/version`)
    if (!response.ok) {
      return
    }
    
    const data = await response.json()
    const latestVersion = data.version
    const downloadUrl = data.downloadUrl
    
    if (latestVersion && latestVersion !== CURRENT_VERSION) {
      const { value } = await Dialog.confirm({
        title: '发现新版本',
        message: `当前版本: ${CURRENT_VERSION}\n最新版本: ${latestVersion}\n\n是否立即更新？`,
        okButtonTitle: '立即更新',
        cancelButtonTitle: '稍后'
      })
      
      if (value && downloadUrl) {
        await Browser.open({ url: downloadUrl })
      }
    }
  } catch (error) {
    console.error('检查版本失败:', error)
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => {
  return CURRENT_VERSION
}
