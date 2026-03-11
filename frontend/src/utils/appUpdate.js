// APP 自动更新服务 - APP内完成版
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
      const { App } = await import('@capacitor/app')
      await App.exitApp()
    }
  } catch (error) {
    console.error('[Update] 检查失败:', error)
  }
}

/**
 * 下载并安装 APK（使用 Capacitor HTTP）
 */
const downloadAndInstallApk = async (version) => {
  const downloadUrl = `${UPDATE_SERVER_URL}/app/pis-latest.apk`
  const fileName = `pis-update-${version}.apk`
  
  try {
    console.log('[Update] 开始下载:', downloadUrl)
    
    // 显示下载中提示
    await Dialog.alert({
      title: '正在下载',
      message: `新版本 ${version} 下载中，请稍候...`,
      okButtonTitle: '后台下载'
    })
    
    // 方法1：尝试使用 Capacitor HTTP 插件下载
    try {
      const { Http } = await import('@capacitor-community/http')
      
      console.log('[Update] 使用 Capacitor HTTP 下载...')
      
      const response = await Http.downloadFile({
        url: downloadUrl,
        filePath: fileName,
        fileDirectory: Directory.ExternalStorage
      })
      
      console.log('[Update] 下载完成:', response)
      
      if (response.path) {
        await installApk(response.path)
        return
      }
    } catch (e) {
      console.error('[Update] Capacitor HTTP 失败:', e)
    }
    
    // 方法2：使用原生 fetch + Blob（备用）
    console.log('[Update] 使用 fetch 下载...')
    await downloadWithFetch(downloadUrl, version)
    
  } catch (error) {
    console.error('[Update] 下载失败:', error)
    await Dialog.alert({
      title: '下载失败',
      message: `${error.message}\n\n将尝试浏览器下载方式。`
    })
    // 最后回退到浏览器
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: downloadUrl })
  }
}

/**
 * 使用 fetch + Blob 下载（备用方案）
 */
const downloadWithFetch = async (url, version) => {
  const fileName = `pis-update-${version}.apk`
  
  // 下载文件
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  
  const blob = await response.blob()
  console.log('[Update] Blob 大小:', blob.size)
  
  if (blob.size < 1024 * 1024) {
    throw new Error('文件太小，下载可能失败')
  }
  
  // 使用 FileReader 读取 Blob 为 base64
  const base64Data = await blobToBase64(blob)
  
  // 保存到外部存储
  await Filesystem.writeFile({
    path: `Download/${fileName}`,
    directory: Directory.ExternalStorage,
    data: base64Data
  })
  
  console.log('[Update] 文件已保存到 Download')
  
  // 获取文件路径
  const fileUri = await Filesystem.getUri({
    path: `Download/${fileName}`,
    directory: Directory.ExternalStorage
  })
  
  await installApk(fileUri.uri)
}

/**
 * Blob 转 Base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // 去掉 data:application/octet-stream;base64, 前缀
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 安装 APK
 */
const installApk = async (filePath) => {
  console.log('[Install] 安装:', filePath)
  
  const { value } = await Dialog.confirm({
    title: '下载完成',
    message: '新版本已下载到 Download 目录，是否立即安装？\n\n安装完成后请重启 APP',
    okButtonTitle: '立即安装',
    cancelButtonTitle: '稍后'
  })
  
  if (!value) return
  
  try {
    // 方法1：FileOpener
    try {
      const { FileOpener } = await import('@capacitor-community/file-opener')
      await FileOpener.open({
        filePath: filePath.replace('file://', ''),
        mimeType: 'application/vnd.android.package-archive'
      })
      return
    } catch (e) {
      console.error('[Install] FileOpener 失败:', e)
    }
    
    // 方法2：使用 a 标签
    const link = document.createElement('a')
    link.href = filePath
    link.download = 'update.apk'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('[Install] 失败:', error)
    await Dialog.alert({
      title: '安装失败',
      message: '无法启动安装器，请手动前往文件管理器安装'
    })
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => CURRENT_VERSION
