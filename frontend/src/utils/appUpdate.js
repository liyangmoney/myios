// APP 自动更新服务 - 纯APP内完成版（无需HTTP插件）
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Filesystem, Directory } from '@capacitor/filesystem'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.0.3'
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
 * 下载并安装 APK（使用 XMLHttpRequest，不依赖插件）
 */
const downloadAndInstallApk = async (version) => {
  const downloadUrl = `${UPDATE_SERVER_URL}/app/pis-latest.apk`
  const fileName = `pis-update-${version}.apk`
  
  console.log('[Update] 开始下载:', version)
  console.log('[Update] URL:', downloadUrl)
  
  try {
    // 显示开始下载提示
    await Dialog.alert({
      title: '开始下载',
      message: `新版本 ${version} 开始下载，请稍候...\n\n下载完成后会自动提示安装。`,
      okButtonTitle: '我知道了'
    })
    
    // 使用 XMLHttpRequest 下载（原生支持，无需插件）
    console.log('[Update] 使用 XMLHttpRequest 下载...')
    const apkData = await downloadWithXHR(downloadUrl)
    
    console.log('[Update] 下载完成，大小:', apkData.byteLength)
    
    // 验证文件大小
    if (apkData.byteLength < 1024 * 1024) {
      throw new Error('文件太小，下载不完整')
    }
    
    // 转换为 base64
    console.log('[Update] 转换文件格式...')
    const base64Data = arrayBufferToBase64(apkData)
    console.log('[Update] Base64 长度:', base64Data.length)
    
    // 保存到 Downloads 目录
    console.log('[Update] 保存文件...')
    const filePath = `Download/${fileName}`
    
    await Filesystem.writeFile({
      path: filePath,
      directory: Directory.ExternalStorage,
      data: base64Data
    })
    
    console.log('[Update] 文件保存成功:', filePath)
    
    // 获取完整路径
    const uriResult = await Filesystem.getUri({
      path: filePath,
      directory: Directory.ExternalStorage
    })
    
    console.log('[Update] 文件 URI:', uriResult.uri)
    
    // 提示安装
    const { value: shouldInstall } = await Dialog.confirm({
      title: '下载完成',
      message: `新版本 ${version} 已下载完成\n文件大小: ${(apkData.byteLength / 1024 / 1024).toFixed(2)} MB\n\n是否立即安装？`,
      okButtonTitle: '立即安装',
      cancelButtonTitle: '稍后'
    })
    
    if (shouldInstall) {
      await installApk(uriResult.uri)
    } else {
      await Dialog.alert({
        title: '已保存',
        message: `APK 已保存到:\nDownload/${fileName}\n\n您可以稍后从文件管理器安装。`
      })
    }
    
  } catch (error) {
    console.error('[Update] 失败:', error)
    await Dialog.alert({
      title: '更新失败',
      message: `${error.message}\n\n请检查网络连接。`
    })
  }
}

/**
 * 使用 XMLHttpRequest 下载文件
 */
const downloadWithXHR = (url) => {
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
  const chunkSize = 0x8000 // 32KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk)
  }
  
  return btoa(binary)
}

/**
 * 安装 APK
 */
const installApk = async (fileUri) => {
  console.log('[Install] 安装:', fileUri)
  
  try {
    // 方法1: 使用 FileOpener
    try {
      const { FileOpener } = await import('@capacitor-community/file-opener')
      await FileOpener.open({
        filePath: fileUri.replace('file://', ''),
        mimeType: 'application/vnd.android.package-archive'
      })
      console.log('[Install] FileOpener 成功')
      return
    } catch (e) {
      console.log('[Install] FileOpener 失败:', e.message)
    }
    
    // 方法2: 使用 a 标签
    const link = document.createElement('a')
    link.href = fileUri
    link.setAttribute('download', 'update.apk')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    console.log('[Install] a 标签已触发')
    
  } catch (error) {
    console.error('[Install] 失败:', error)
    await Dialog.alert({
      title: '安装失败',
      message: '无法启动安装器，请使用文件管理器手动安装。'
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => CURRENT_VERSION
