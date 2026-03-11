// APP 自动更新服务
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Filesystem, Directory } from '@capacitor/filesystem'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.5.0'
const UPDATE_SERVER_URL = 'http://myjghy.myds.me:9090'

/**
 * 检查 APP 版本并自动下载更新
 */
export const checkAndUpdateApp = async () => {
  if (!Capacitor.isNativePlatform()) return
  
  try {
    console.log('[Update] 检查版本...')
    
    const response = await fetch(`${UPDATE_SERVER_URL}/api/app/version`)
    if (!response.ok) return
    
    const data = await response.json()
    const latestVersion = data.data?.version || data.version
    const updateLog = data.data?.updateLog || '有新版本可用'
    const forceUpdate = data.data?.forceUpdate || false
    
    console.log('[Update] 当前:', CURRENT_VERSION, '最新:', latestVersion)
    
    if (!latestVersion || latestVersion === CURRENT_VERSION) return
    
    const { value } = await Dialog.confirm({
      title: `发现新版本 ${latestVersion}`,
      message: `当前: ${CURRENT_VERSION}\n最新: ${latestVersion}\n\n${updateLog}\n\n是否更新？`,
      okButtonTitle: '立即更新',
      cancelButtonTitle: forceUpdate ? '退出' : '稍后'
    })
    
    if (value) {
      await downloadAndInstallApk(latestVersion)
    } else if (forceUpdate) {
      try {
        const { App } = await import('@capacitor/app')
        await App.exitApp()
      } catch (e) {}
    }
  } catch (error) {
    console.error('[Update] 检查失败:', error)
  }
}

/**
 * 下载并安装 APK
 */
const downloadAndInstallApk = async (version) => {
  const downloadUrl = `${UPDATE_SERVER_URL}/app/pis-latest.apk`
  const fileName = `pis-update-${version}.apk`
  
  try {
    // 显示下载提示
    await Dialog.alert({
      title: '开始下载',
      message: `新版本 ${version} 下载中，请稍候...`,
      okButtonTitle: '后台下载'
    })
    
    // 使用 XMLHttpRequest 下载
    const apkData = await downloadFile(downloadUrl)
    
    console.log('[Update] 下载完成，大小:', apkData.byteLength)
    
    if (apkData.byteLength < 1024 * 1024) {
      throw new Error('文件太小，下载不完整')
    }
    
    // 转换为 base64
    const base64Data = arrayBufferToBase64(apkData)
    
    // 保存到 Downloads 目录
    const filePath = `Download/${fileName}`
    await Filesystem.writeFile({
      path: filePath,
      directory: Directory.ExternalStorage,
      data: base64Data
    })
    
    // 获取完整路径
    const uriResult = await Filesystem.getUri({
      path: filePath,
      directory: Directory.ExternalStorage
    })
    
    console.log('[Update] 文件保存到:', uriResult.uri)
    
    // 提示用户安装 - 使用浏览器打开（系统会自动处理安装）
    const { value: shouldInstall } = await Dialog.confirm({
      title: '下载完成',
      message: `新版本 ${version} 已下载完成\n\n点击"立即安装"将打开系统安装器`,
      okButtonTitle: '立即安装',
      cancelButtonTitle: '稍后'
    })
    
    if (shouldInstall) {
      // 使用 Browser 打开 APK，系统会自动启动安装器
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: uriResult.uri })
      console.log('[Update] 已调用浏览器打开 APK')
    }
    
  } catch (error) {
    console.error('[Update] 失败:', error)
    await Dialog.alert({
      title: '更新失败',
      message: `${error.message}\n\n请稍后重试或手动下载更新。`
    })
  }
}

/**
 * 下载文件
 */
const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response)
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    }
    
    xhr.onerror = () => reject(new Error('网络请求失败'))
    xhr.ontimeout = () => reject(new Error('请求超时'))
    
    xhr.send()
  })
}

/**
 * ArrayBuffer 转 Base64
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk)
  }
  
  return btoa(binary)
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => CURRENT_VERSION
