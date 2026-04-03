// APP 自动更新服务 - 简化版（使用系统下载）
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Browser } from '@capacitor/browser'
import apiConfig from '@/api/config'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.8.6'

// 获取更新服务器 URL
const getUpdateServerUrl = () => {
  const baseURL = apiConfig?.baseURL || '/api'
  if (baseURL.startsWith('http')) {
    return baseURL.replace('/api', '')
  }
  return 'http://myjghy.myds.me:9090'
}

/**
 * 检查 APP 版本并自动下载更新
 */
export const checkAndUpdateApp = async () => {
  // 只在 APP 环境中检查
  if (!Capacitor.isNativePlatform()) {
    return
  }
  
  try {
    console.log('[Update] 检查 APP 更新...')
    
    const updateServerUrl = getUpdateServerUrl()
    // 获取最新版本信息
    const response = await fetch(`${updateServerUrl}/api/app/version`)
    if (!response.ok) {
      console.error('[Update] 获取版本信息失败')
      return
    }
    
    const data = await response.json()
    const latestVersion = data.data?.version || data.version
    const apkUrl = data.data?.apkUrl || data.apkUrl
    const updateLog = data.data?.updateLog || '有新版本可用'
    const forceUpdate = data.data?.forceUpdate || false
    
    console.log('[Update] 当前版本:', CURRENT_VERSION, '最新版本:', latestVersion)
    
    if (!latestVersion || latestVersion === CURRENT_VERSION) {
      console.log('[Update] 已是最新版本')
      return
    }
    
    // 弹出更新提示
    const { value } = await Dialog.confirm({
      title: `发现新版本 ${latestVersion}`,
      message: `当前版本: ${CURRENT_VERSION}\n最新版本: ${latestVersion}\n\n更新内容:\n${updateLog}\n\n是否立即下载更新？`,
      okButtonTitle: '立即更新',
      cancelButtonTitle: forceUpdate ? '退出' : '稍后'
    })
    
    if (value && apkUrl) {
      await downloadAndInstallApk(apkUrl, latestVersion)
    } else if (forceUpdate) {
      // 强制更新，用户拒绝则退出 APP
      const { App } = await import('@capacitor/app')
      await App.exitApp()
    }
  } catch (error) {
    console.error('[Update] 检查更新失败:', error)
  }
}

/**
 * 下载并安装 APK（使用系统浏览器下载）
 * 最简单可靠的方式：浏览器下载 → 通知栏点击安装
 */
const downloadAndInstallApk = async (apkUrl, version) => {
  try {
    console.log('[Update] 开始下载:', apkUrl)
    
    // 直接使用浏览器打开下载链接
    // 安卓系统会自动下载并显示在通知栏
    await Browser.open({ url: apkUrl })
    
    console.log('[Update] 浏览器已打开下载链接')
    
    // 提示用户如何操作
    await Dialog.alert({
      title: '正在下载',
      message: `新版本 ${version} 正在下载中...\n\n请查看通知栏的下载进度，下载完成后点击通知即可安装。\n\n注意：\n1. 首次安装需要允许"未知来源"权限\n2. 安装完成后请手动重启 APP`,
      okButtonTitle: '我知道了'
    })
    
  } catch (error) {
    console.error('[Update] 下载失败:', error)
    
    await Dialog.alert({
      title: '下载失败',
      message: `无法启动下载: ${error.message}\n\n请前往官网手动下载最新版本。`
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => {
  return CURRENT_VERSION
}
