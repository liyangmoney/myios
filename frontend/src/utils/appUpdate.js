// APP 自动更新服务 - 带进度条版
import { Capacitor } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Filesystem, Directory } from '@capacitor/filesystem'

// 当前版本号（每次发版时更新）
const CURRENT_VERSION = '1.0.3'
const UPDATE_SERVER_URL = 'http://myjghy.myds.me:9090'

// 显示进度（使用 Dialog 或 Toast）
let progressDialog = null

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
 * 显示进度对话框
 */
const showProgressDialog = async (message, percent) => {
  try {
    // 使用简单的 Alert 作为进度提示
    // 实际项目中可以使用 Toast 或自定义进度组件
    if (window.Capacitor) {
      // 尝试使用 Toast
      try {
        const { Toast } = await import('@capacitor/toast')
        await Toast.show({
          text: `${message} ${percent > 0 ? percent + '%' : ''}`,
          duration: 'short'
        })
      } catch (e) {
        console.log('[Update] Toast:', message, percent + '%')
      }
    }
  } catch (e) {
    console.log('[Update] Progress:', message, percent + '%')
  }
}

/**
 * 下载并安装 APK（带进度条）
 */
const downloadAndInstallApk = async (version) => {
  const downloadUrl = `${UPDATE_SERVER_URL}/app/pis-latest.apk`
  const fileName = `pis-update-${version}.apk`
  
  console.log('[Update] 开始下载:', version)
  console.log('[Update] URL:', downloadUrl)
  
  try {
    // 显示开始下载
    showProgressDialog('开始下载...', 0)
    
    // 使用 XMLHttpRequest 下载（带进度）
    console.log('[Update] 开始下载...')
    const apkData = await downloadWithProgress(downloadUrl, (percent) => {
      showProgressDialog('下载中', percent)
    })
    
    console.log('[Update] 下载完成，大小:', apkData.byteLength)
    showProgressDialog('下载完成', 100)
    
    // 验证文件大小
    if (apkData.byteLength < 1024 * 1024) {
      throw new Error('文件太小，下载不完整')
    }
    
    // 显示保存中
    showProgressDialog('正在保存...', 0)
    
    // 转换为 base64
    console.log('[Update] 转换文件格式...')
    const base64Data = arrayBufferToBase64(apkData)
    
    // 保存到 Downloads 目录
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
      await installApk(uriResult.uri, fileName)
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
 * 使用 XMLHttpRequest 下载文件（带进度）
 */
const downloadWithProgress = (url, onProgress) => {
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
  const chunkSize = 0x8000 // 32KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk)
  }
  
  return btoa(binary)
}

/**
 * 安装 APK（使用最可靠的方式）
 */
const installApk = async (fileUri, fileName) => {
  console.log('[Install] 开始安装:', fileUri)
  
  try {
    // 方法1: 使用 FileOpener 插件（如果可用）
    try {
      const { FileOpener } = await import('@capacitor-community/file-opener')
      const cleanPath = fileUri.replace('file://', '')
      
      await FileOpener.open({
        filePath: cleanPath,
        mimeType: 'application/vnd.android.package-archive'
      })
      console.log('[Install] FileOpener 调用成功')
      return
    } catch (e) {
      console.log('[Install] FileOpener 不可用:', e.message)
    }
    
    // 方法2: 使用 Capacitor Browser 打开文件
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: fileUri })
      console.log('[Install] Browser 调用成功')
      return
    } catch (e) {
      console.log('[Install] Browser 失败:', e.message)
    }
    
    // 方法3: 提示用户手动安装
    await Dialog.alert({
      title: '请手动安装',
      message: `由于系统限制，请手动前往文件管理器安装:\n\nDownload/${fileName}\n\n点击确定将打开文件位置。`
    })
    
    // 尝试打开文件位置
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: fileUri })
    } catch (e) {
      console.log('[Install] 打开文件失败:', e.message)
    }
    
  } catch (error) {
    console.error('[Install] 失败:', error)
    await Dialog.alert({
      title: '安装失败',
      message: `无法启动安装器，请使用文件管理器手动安装:\nDownload/${fileName}`
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => CURRENT_VERSION
