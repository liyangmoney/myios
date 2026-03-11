// APP 自动更新服务 - 纯APP内完成版
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
    const updateLog = data.data?.updateLog || '有新版本可用'
    const forceUpdate = data.data?.forceUpdate || false
    
    console.log('[Update] 当前:', CURRENT_VERSION, '最新:', latestVersion)
    
    if (!latestVersion || latestVersion === CURRENT_VERSION) {
      console.log('[Update] 已是最新版本')
      return
    }
    
    // 显示更新提示
    const { value } = await Dialog.confirm({
      title: `发现新版本 ${latestVersion}`,
      message: `当前版本: ${CURRENT_VERSION}\n最新版本: ${latestVersion}\n\n更新内容:\n${updateLog}\n\n是否立即下载更新？`,
      okButtonTitle: '立即更新',
      cancelButtonTitle: forceUpdate ? '退出' : '稍后'
    })
    
    if (value) {
      await downloadAndInstallApk(latestVersion)
    } else if (forceUpdate) {
      // 强制更新，用户拒绝则退出 APP
      try {
        const { App } = await import('@capacitor/app')
        await App.exitApp()
      } catch (e) {
        console.error('[Update] 退出失败:', e)
      }
    }
  } catch (error) {
    console.error('[Update] 检查更新失败:', error)
  }
}

/**
 * 下载并安装 APK（纯APP内完成）
 */
const downloadAndInstallApk = async (version) => {
  const downloadUrl = `${UPDATE_SERVER_URL}/app/pis-latest.apk`
  const fileName = `pis-update-${version}.apk`
  
  console.log('[Update] ===== 开始下载流程 =====')
  console.log('[Update] 版本:', version)
  console.log('[Update] URL:', downloadUrl)
  console.log('[Update] 文件名:', fileName)
  
  try {
    // 步骤1：使用 Capacitor HTTP 插件下载（原生层，最可靠）
    console.log('[Update] 步骤1: 开始下载...')
    
    let filePath = null
    
    try {
      const { Http } = await import('@capacitor-community/http')
      
      console.log('[Update] 使用 Capacitor HTTP 插件...')
      
      // 显示下载中
      showProgress('开始下载...', 0)
      
      const response = await Http.downloadFile({
        url: downloadUrl,
        filePath: fileName,
        fileDirectory: Directory.External,
        progress: true
      })
      
      console.log('[Update] HTTP 下载结果:', response)
      
      if (response.path) {
        filePath = response.path
        console.log('[Update] 下载成功，路径:', filePath)
        showProgress('下载完成', 100)
      } else {
        throw new Error('下载未返回文件路径')
      }
      
    } catch (httpError) {
      console.error('[Update] HTTP 下载失败:', httpError)
      console.log('[Update] 尝试备用方案...')
      
      // 备用：使用 fetch + Filesystem
      filePath = await downloadWithFetch(downloadUrl, fileName)
    }
    
    if (!filePath) {
      throw new Error('所有下载方式都失败')
    }
    
    // 步骤2：验证文件
    console.log('[Update] 步骤2: 验证文件...')
    const statResult = await Filesystem.stat({
      path: fileName,
      directory: Directory.External
    })
    
    console.log('[Update] 文件信息:', statResult)
    
    if (statResult.size < 1024 * 1024) {
      throw new Error(`文件太小(${statResult.size} bytes)，可能下载不完整`)
    }
    
    console.log('[Update] 文件大小验证通过:', (statResult.size / 1024 / 1024).toFixed(2), 'MB')
    
    // 步骤3：获取文件 URI
    console.log('[Update] 步骤3: 获取文件 URI...')
    const uriResult = await Filesystem.getUri({
      path: fileName,
      directory: Directory.External
    })
    
    console.log('[Update] 文件 URI:', uriResult.uri)
    
    // 步骤4：提示安装
    console.log('[Update] 步骤4: 提示用户安装...')
    const { value: shouldInstall } = await Dialog.confirm({
      title: '下载完成',
      message: `新版本 ${version} 已下载完成\n文件大小: ${(statResult.size / 1024 / 1024).toFixed(2)} MB\n\n是否立即安装？\n\n注意：安装完成后请手动重启 APP`,
      okButtonTitle: '立即安装',
      cancelButtonTitle: '稍后安装'
    })
    
    if (shouldInstall) {
      console.log('[Update] 用户选择安装')
      await installApk(uriResult.uri, fileName)
    } else {
      console.log('[Update] 用户选择稍后安装')
      await Dialog.alert({
        title: '已保存',
        message: `APK 已保存到:\nDownload/${fileName}\n\n您可以稍后从文件管理器中安装。`
      })
    }
    
  } catch (error) {
    console.error('[Update] ===== 下载安装失败 =====')
    console.error('[Update] 错误:', error)
    
    await Dialog.alert({
      title: '更新失败',
      message: `错误: ${error.message}\n\n请检查网络连接或稍后重试。`
    })
  }
}

/**
 * 备用下载方案：fetch + Filesystem
 */
const downloadWithFetch = async (url, fileName) => {
  console.log('[Download] 使用 fetch 下载...')
  
  // 显示进度
  showProgress('正在下载...', 0)
  
  // 下载
  const response = await fetch(url)
  console.log('[Download] Response status:', response.status)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  // 获取 blob
  const blob = await response.blob()
  console.log('[Download] Blob size:', blob.size)
  
  if (blob.size < 1024 * 1024) {
    throw new Error('文件太小，下载失败')
  }
  
  showProgress('正在保存...', 90)
  
  // 转为 base64
  const base64 = await blobToBase64(blob)
  console.log('[Download] Base64 length:', base64.length)
  
  // 写入文件
  await Filesystem.writeFile({
    path: fileName,
    directory: Directory.External,
    data: base64
  })
  
  console.log('[Download] 文件已保存:', fileName)
  showProgress('保存完成', 100)
  
  return fileName
}

/**
 * Blob 转 Base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      try {
        // 去掉 data:application/octet-stream;base64, 前缀
        const result = reader.result
        const base64 = result.split(',')[1]
        resolve(base64)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 显示进度（使用 Dialog 或 Toast）
 */
const showProgress = async (message, percent) => {
  console.log(`[Progress] ${message} ${percent}%`)
  // 这里可以用 Toast，但为了简单先用 console
}

/**
 * 安装 APK
 */
const installApk = async (fileUri, fileName) => {
  console.log('[Install] ===== 开始安装 =====')
  console.log('[Install] URI:', fileUri)
  console.log('[Install] 文件名:', fileName)
  
  try {
    // 方法1: 使用 FileOpener 插件
    try {
      console.log('[Install] 尝试 FileOpener...')
      const { FileOpener } = await import('@capacitor-community/file-opener')
      
      // 去掉 file:// 前缀
      const cleanPath = fileUri.replace('file://', '')
      console.log('[Install] FileOpener 路径:', cleanPath)
      
      await FileOpener.open({
        filePath: cleanPath,
        mimeType: 'application/vnd.android.package-archive'
      })
      
      console.log('[Install] FileOpener 成功')
      return
      
    } catch (e) {
      console.error('[Install] FileOpener 失败:', e.message)
    }
    
    // 方法2: 使用 WebView 打开文件链接
    try {
      console.log('[Install] 尝试 WebView 打开...')
      window.location.href = fileUri
      console.log('[Install] WebView 已触发')
      return
      
    } catch (e) {
      console.error('[Install] WebView 打开失败:', e.message)
    }
    
    // 方法3: 使用 a 标签
    try {
      console.log('[Install] 尝试 a 标签...')
      const link = document.createElement('a')
      link.href = fileUri
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log('[Install] a 标签已触发')
      return
      
    } catch (e) {
      console.error('[Install] a 标签失败:', e.message)
    }
    
    // 所有方法都失败
    throw new Error('无法启动安装器')
    
  } catch (error) {
    console.error('[Install] ===== 安装失败 =====')
    console.error('[Install] 错误:', error)
    
    await Dialog.alert({
      title: '安装失败',
      message: `无法启动安装器。\n\nAPK 已保存到:\nDownload/${fileName}\n\n请使用文件管理器手动安装。`
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => CURRENT_VERSION
