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
    const forceUpdate = data.data?.forceUpdate || false
    
    console.log('当前版本:', CURRENT_VERSION, '最新版本:', latestVersion)
    
    if (!latestVersion || latestVersion === CURRENT_VERSION) {
      return // 已是最新版本
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
    console.error('检查更新失败:', error)
  }
}

/**
 * 下载并安装 APK（APP 内完成）
 */
const downloadAndInstallApk = async (apkUrl, version) => {
  try {
    console.log('开始下载新版本:', version)
    
    // 显示 Toast 提示（非阻塞）
    showToast(`新版本 ${version} 开始下载...`, 3000)
    
    // 直接开始下载，不等待弹窗
    const fileName = `pis-update-${version}.apk`
    const downloadPath = `${UPDATE_SERVER_URL}/app/pis-latest.apk`
    
    console.log('下载地址:', downloadPath)
    
    // 使用 XMLHttpRequest 下载（支持进度）
    let lastProgress = 0
    const apkData = await downloadFileWithProgress(downloadPath, (progress) => {
      // 每 10% 更新一次提示
      if (progress - lastProgress >= 10) {
        lastProgress = progress
        showToast(`下载进度: ${progress}%`, 2000)
        console.log(`下载进度: ${progress}%`)
      }
    })
    
    console.log('下载完成，文件大小:', apkData.byteLength)
    
    // 保存到应用缓存目录
    showToast('下载完成，正在保存...', 2000)
    
    const base64Data = arrayBufferToBase64(apkData)
    const filePath = `updates/${fileName}`
    
    // 确保目录存在
    try {
      await Filesystem.mkdir({
        path: 'updates',
        directory: Directory.Cache,
        recursive: true
      })
    } catch (e) {
      // 目录可能已存在
    }
    
    // 写入文件
    await Filesystem.writeFile({
      path: filePath,
      directory: Directory.Cache,
      data: base64Data
    })
    
    console.log('APK 已保存到缓存:', filePath)
    
    // 获取完整文件路径
    const fileUri = await Filesystem.getUri({
      path: filePath,
      directory: Directory.Cache
    })
    
    console.log('APK 文件 URI:', fileUri.uri)
    
    // 提示用户安装
    console.log('[Update] 显示安装确认弹窗')
    const { value: installConfirmed } = await Dialog.confirm({
      title: '下载完成',
      message: '新版本已下载完成，是否立即安装？\n\n注意：安装完成后需要手动重启 APP',
      okButtonTitle: '立即安装',
      cancelButtonTitle: '稍后'
    })
    
    console.log('[Update] 用户选择:', installConfirmed ? '立即安装' : '稍后')
    
    if (installConfirmed) {
      showToast('正在准备安装...', 2000)
      // 安装 APK
      await installApk(fileUri.uri)
    }
    
  } catch (error) {
    console.error('下载或安装失败:', error)
    await Dialog.alert({
      title: '更新失败',
      message: `下载失败: ${error.message}\n\n将使用浏览器下载方式。`
    })
    // 失败时回退到浏览器下载
    await downloadWithBrowser(apkUrl)
  }
}

/**
 * 显示 Toast 提示（使用原生 Toast 或简单的 console）
 */
const showToast = async (message, duration = 2000) => {
  try {
    // 尝试使用原生 Toast
    const { Toast } = await import('@capacitor/toast')
    await Toast.show({
      text: message,
      duration: duration > 2000 ? 'long' : 'short'
    })
  } catch (e) {
    // 如果 Toast 插件不可用，使用 console
    console.log('[Toast]', message)
    // 同时通过 screenLog 显示（如果有的话）
    if (window.screenLog) {
      window.screenLog(message)
    }
  }
}

/**
 * 下载文件并返回 ArrayBuffer
 */
const downloadFileWithProgress = (url, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response)
      } else {
        reject(new Error(`HTTP ${xhr.status}`))
      }
    }
    
    xhr.onerror = () => reject(new Error('网络错误'))
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
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 安装 APK（多种方案尝试）
 */
const installApk = async (fileUri) => {
  console.log('[Install] 开始安装 APK:', fileUri)
  
  try {
    // 方法1：尝试使用 FileOpener 插件
    try {
      console.log('[Install] 尝试使用 FileOpener...')
      const { FileOpener } = await import('@capacitor-community/file-opener')
      
      // FileOpener 需要的是路径，不是 file:// URI
      const path = fileUri.replace('file://', '')
      console.log('[Install] FileOpener 路径:', path)
      
      await FileOpener.open({
        filePath: path,
        mimeType: 'application/vnd.android.package-archive'
      })
      console.log('[Install] FileOpener 调用成功')
      
      showToast('正在打开安装器...', 3000)
      return
    } catch (e) {
      console.error('[Install] FileOpener 失败:', e)
    }
    
    // 方法2：使用 a 标签点击（触发系统下载安装）
    try {
      console.log('[Install] 尝试使用 a 标签...')
      
      const link = document.createElement('a')
      link.href = fileUri
      link.setAttribute('download', 'pis-update.apk')
      link.setAttribute('type', 'application/vnd.android.package-archive')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('[Install] a 标签点击成功')
      showToast('请查看通知栏，点击下载完成通知进行安装', 5000)
      return
    } catch (e) {
      console.error('[Install] a 标签失败:', e)
    }
    
    // 方法3：使用浏览器打开（最后手段）
    console.log('[Install] 尝试使用浏览器...')
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: fileUri })
    console.log('[Install] 浏览器调用成功')
    
  } catch (error) {
    console.error('[Install] 所有安装方法都失败:', error)
    
    await Dialog.alert({
      title: '安装失败',
      message: `无法打开安装器: ${error.message}\n\n请手动前往设置-应用-安装未知应用，允许本应用后重试。`
    })
    
    throw error
  }
}

/**
 * 使用浏览器下载（备用方案）
 */
const downloadWithBrowser = async (apkUrl) => {
  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url: apkUrl })
    
    await Dialog.alert({
      title: '请在浏览器中下载',
      message: 'APK 已在浏览器中打开，下载完成后请手动安装。\n\n注意：首次安装可能需要允许"未知来源"安装权限。'
    })
  } catch (error) {
    console.error('浏览器下载失败:', error)
  }
}

/**
 * 获取当前版本号
 */
export const getCurrentVersion = () => {
  return CURRENT_VERSION
}
