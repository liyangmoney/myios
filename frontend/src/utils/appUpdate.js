// APP 自动更新服务
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.0.0'
const UPDATE_SERVER_URL = 'http://myjghy.myds.me:9090'

/**
 * 检查 APP 版本并自动下载更新
 */
export const checkAndUpdateApp = async () => {
  // 只在 APP 环境中检查
  if (!Capacitor.isNativePlatform()) {
    return
  }
  
  try {
    console.log('检查 APP 更新...')
    
    // 获取最新版本信息
    const response = await fetch(`${UPDATE_SERVER_URL}/api/app/version`)
    if (!response.ok) {
      console.error('获取版本信息失败')
      return
    }
    
    const data = await response.json()
    const latestVersion = data.data?.version || data.version
    const apkUrl = data.data?.apkUrl || data.apkUrl
    const updateLog = data.data?.updateLog || '有新版本可用'
    
    console.log('当前版本:', CURRENT_VERSION, '最新版本:', latestVersion)
    
    if (!latestVersion || latestVersion === CURRENT_VERSION) {
      return // 已是最新版本
    }
    
    // 弹出更新提示
    const { value } = await Dialog.confirm({
      title: `发现新版本 ${latestVersion}`,
      message: `当前版本: ${CURRENT_VERSION}\n最新版本: ${latestVersion}\n\n更新内容:\n${updateLog}\n\n是否立即下载更新？`,
      okButtonTitle: '立即更新',
      cancelButtonTitle: '稍后'
    })
    
    if (value && apkUrl) {
      await downloadAndInstallApk(apkUrl)
    }
  } catch (error) {
    console.error('检查更新失败:', error)
  }
}

/**
 * 下载并安装 APK
 */
const downloadAndInstallApk = async (apkUrl) => {
  try {
    // 显示下载进度提示
    await Dialog.alert({
      title: '下载中',
      message: '正在下载新版本，请稍候...'
    })
    
    // 使用原生下载（需要后端配合提供下载接口）
    // 这里先使用系统浏览器下载
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: apkUrl })
    
    // 提示用户下载完成后手动安装
    await Dialog.alert({
      title: '下载完成',
      message: 'APK 已下载，请在下载完成后点击安装。\n\n注意：首次安装可能需要允许"未知来源"安装权限。'
    })
  } catch (error) {
    console.error('下载失败:', error)
    await Dialog.alert({
      title: '下载失败',
      message: '请检查网络连接后重试，或前往官网手动下载。'
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => {
  return CURRENT_VERSION
}
