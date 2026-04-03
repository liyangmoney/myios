// APP 自动更新服务
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Toast } from '@capacitor/toast'
import { Filesystem, Directory } from '@capacitor/filesystem'
import apiConfig from '@/api/config'

// 当前版本号（每次发版时由 GitHub Actions 自动同步）
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
  if (!Capacitor.isNativePlatform()) return
  
  try {
    console.log('[Update] 检查版本...')
    
    const updateServerUrl = getUpdateServerUrl()
    const response = await fetch(`${updateServerUrl}/api/app/version`)
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
    // 使用 Toast 提示开始下载（非阻塞）
    await Toast.show({
      text: `新版本 ${version} 开始下载...`,
      duration: 'long'
    })
    
    // 使用 XMLHttpRequest 下载（带进度）
    let lastProgress = -1
    const apkData = await downloadFileWithProgress(downloadUrl, (percent) => {
      // 每 10% 显示一次，确保 0% 和 100% 都显示
      const milestone = Math.floor(percent / 10) * 10
      if (milestone > lastProgress) {
        lastProgress = milestone
        const msg = `下载进度: ${percent}%`
        console.log(`[Update] ${msg}`)
        
        // 同时显示到 screenLog
        if (typeof window !== 'undefined' && window.screenLog) {
          window.screenLog(msg)
        }
        
        // 使用长时长 Toast
        Toast.show({
          text: msg,
          duration: 'long'
        })
      }
    })
    
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
    
    // 提示用户安装
    const { value: shouldInstall } = await Dialog.confirm({
      title: '下载完成',
      message: `新版本 ${version} 已下载完成\n文件大小: ${(apkData.byteLength / 1024 / 1024).toFixed(2)} MB\n\n是否立即安装？\n\n注意：安装完成后请手动重启 APP`,
      okButtonTitle: '立即安装',
      cancelButtonTitle: '稍后'
    })
    
    if (shouldInstall) {
      // 使用 FileOpener 打开 APK（如果可用）
      try {
        const { FileOpener } = await import('@capacitor-community/file-opener')
        const cleanPath = uriResult.uri.replace('file://', '')
        await FileOpener.open({
          filePath: cleanPath,
          mimeType: 'application/vnd.android.package-archive'
        })
        console.log('[Update] FileOpener 调用成功')
      } catch (e) {
        // FileOpener 失败，提示用户手动安装
        console.log('[Update] FileOpener 失败:', e.message)
        await Dialog.alert({
          title: '请手动安装',
          message: `APK 已保存到:\nDownload/${fileName}\n\n请打开文件管理器，找到该文件后点击安装。\n\n注意：首次安装可能需要允许"安装未知应用"权限。`
        })
      }
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
 * 下载文件（带进度）
 */
const downloadFileWithProgress = (url, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    
    let lastPercent = 0
    
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        if (percent > lastPercent) {
          lastPercent = percent
          onProgress(percent)
        }
      }
    }
    
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
