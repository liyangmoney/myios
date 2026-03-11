// APP 自动更新服务 - 可靠版
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Filesystem, Directory } from '@capacitor/filesystem'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.0.0'
const UPDATE_SERVER_URL = 'http://myjghy.myds.me:9090'

/**
 * 检查 APP 版本并自动下载更新
 */
export const checkAndUpdateApp = async () => {
  if (!Capacitor.isNativePlatform()) return
  
  try {
    console.log('[Update] 检查版本...')
    
    const response = await fetch(`${UPDATE_SERVER_URL}/api/app/version`)
    if (!response.ok) {
      console.error('[Update] 获取版本失败:', response.status)
      return
    }
    
    const data = await response.json()
    const latestVersion = data.data?.version || data.version
    const apkUrl = data.data?.apkUrl || data.apkUrl
    const updateLog = data.data?.updateLog || '有新版本可用'
    const forceUpdate = data.data?.forceUpdate || false
    
    console.log('[Update] 当前:', CURRENT_VERSION, '最新:', latestVersion)
    
    if (!latestVersion || latestVersion === CURRENT_VERSION) {
      console.log('[Update] 已是最新')
      return
    }
    
    const { value } = await Dialog.confirm({
      title: `发现新版本 ${latestVersion}`,
      message: `当前: ${CURRENT_VERSION}\n最新: ${latestVersion}\n\n${updateLog}\n\n是否更新？`,
      okButtonTitle: '立即更新',
      cancelButtonTitle: forceUpdate ? '退出' : '稍后'
    })
    
    if (value && apkUrl) {
      await downloadAndInstallApk(apkUrl, latestVersion)
    } else if (forceUpdate) {
      const { App } = await import('@capacitor/app')
      await App.exitApp()
    }
  } catch (error) {
    console.error('[Update] 检查失败:', error)
  }
}

/**
 * 下载并安装 APK
 */
const downloadAndInstallApk = async (apkUrl, version) => {
  try {
    console.log('[Update] 开始下载:', version)
    
    // 方法：使用系统浏览器下载（最可靠）
    // 浏览器会自动处理下载并在通知栏显示进度
    const { Browser } = await import('@capacitor/browser')
    
    await Dialog.alert({
      title: '开始下载',
      message: `新版本 ${version} 将在浏览器中下载。\n\n下载完成后，请下拉通知栏点击下载完成的通知进行安装。`,
      okButtonTitle: '开始下载'
    })
    
    // 打开浏览器下载 APK
    await Browser.open({ url: `${UPDATE_SERVER_URL}/app/pis-latest.apk` })
    
    console.log('[Update] 浏览器已打开')
    
  } catch (error) {
    console.error('[Update] 失败:', error)
    await Dialog.alert({
      title: '更新失败',
      message: error.message
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => CURRENT_VERSION
