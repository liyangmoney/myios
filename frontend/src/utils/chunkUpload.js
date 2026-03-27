// 分片上传工具函数
import apiConfig from '@/api/config'
import { Capacitor } from '@capacitor/core'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 每块
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB 阈值

// 默认服务器地址（用于原生平台）
const DEFAULT_SERVER_URL = 'http://myjghy.myds.me:9090'

// 获取完整 API URL
const getApiUrl = (path) => {
  const baseURL = apiConfig.baseURL
  
  // 原生平台：必须使用完整的服务器地址
  if (Capacitor.isNativePlatform()) {
    if (baseURL.startsWith('http')) {
      return `${baseURL}${path}`
    }
    return `${DEFAULT_SERVER_URL}${baseURL}${path}`
  }
  
  // 浏览器环境：使用完整服务器地址，避免跨域和代理问题
  if (baseURL.startsWith('http')) {
    return `${baseURL}${path}`
  }
  // 拼接完整URL，使用后端服务器地址
  return `${DEFAULT_SERVER_URL}${baseURL}${path}`
}

// 判断是否为原生平台
const isNativePlatform = () => Capacitor.isNativePlatform()

// 获取 Token
const getToken = () => localStorage.getItem('token')

// 测试服务器连接
const testServerConnection = async (url) => {
  console.log('[Test] Testing connection to:', url)
  try {
    // 测试 /ping 接口（不需要认证）
    const baseUrl = url.replace(/\/api\/.*$/, '')
    const testUrl = baseUrl + '/ping'
    console.log('[Test] Test URL:', testUrl)
    
    const response = await fetch(testUrl, {
      method: 'GET',
    })
    console.log('[Test] Connection test status:', response.status)
    return response.ok
  } catch (error) {
    console.error('[Test] Connection test failed:', error?.message)
    return false
  }
}

// 安全的 base64 编码（处理大文件）
const arrayBufferToBase64 = (buffer) => {
  try {
    const bytes = new Uint8Array(buffer)
    console.log('[Base64] Encoding', bytes.length, 'bytes')
    
    // 对于大文件，分块编码
    const chunkSize = 0x8000 // 32KB chunks
    let result = ''
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      result += String.fromCharCode.apply(null, chunk)
      
      // 每处理 1MB 输出进度
      if (i % (1024 * 1024) === 0) {
        console.log('[Base64] Progress:', Math.round((i / bytes.length) * 100) + '%')
      }
    }
    
    console.log('[Base64] String created, length:', result.length)
    const base64 = btoa(result)
    console.log('[Base64] Base64 encoded, length:', base64.length)
    return base64
  } catch (error) {
    console.error('[Base64] Encoding failed:', error)
    throw new Error('文件编码失败: ' + error.message)
  }
}

/**
 * 原生平台分片上传
 * 将文件分成小块，逐块上传，支持真实进度
 */
const nativeChunkUpload = async (url, file, onProgress) => {
  const token = getToken()
  const chunkSize = 2 * 1024 * 1024 // 2MB 每块，适合移动端
  const totalChunks = Math.ceil(file.size / chunkSize)
  const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log('[NativeChunkUpload] File:', file.name, 'Size:', file.size, 'Chunks:', totalChunks)
  
  // 先初始化分片上传
  const initUrl = url.replace('/upload?', '/upload/init?')
  const initRes = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      totalChunks: totalChunks,
      uploadId: uploadId
    })
  })
  
  if (!initRes.ok) {
    throw new Error('初始化上传失败')
  }
  
  const { uploadId: serverUploadId } = await initRes.json()
  
  // 逐块上传
  const uploadedChunks = []
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    
    // 读取块为 ArrayBuffer
    const arrayBuffer = await chunk.arrayBuffer()
    
    // 使用 XMLHttpRequest 上传块，支持进度
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const chunkUrl = url.replace('/upload?', `/upload/chunk?uploadId=${serverUploadId}&chunkIndex=${i}&totalChunks=${totalChunks}`)
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          // 计算总体进度：已完成的块 + 当前块进度
          const chunkProgress = event.loaded / event.total
          const totalProgress = Math.round(((i + chunkProgress) / totalChunks) * 100)
          onProgress(totalProgress)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`块 ${i} 上传失败: ${xhr.status}`))
        }
      }
      
      xhr.onerror = () => reject(new Error(`块 ${i} 网络错误`))
      xhr.ontimeout = () => reject(new Error(`块 ${i} 超时`))
      
      xhr.open('POST', chunkUrl, true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      xhr.send(arrayBuffer)
    })
    
    uploadedChunks.push(i)
    console.log(`[NativeChunkUpload] Chunk ${i + 1}/${totalChunks} uploaded`)
  }
  
  // 合并分片
  const mergeUrl = url.replace('/upload?', `/upload/merge?uploadId=${serverUploadId}`)
  const mergeRes = await fetch(mergeUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      totalChunks: totalChunks
    })
  })
  
  if (!mergeRes.ok) {
    throw new Error('合并分片失败')
  }
  
  return await mergeRes.json()
}

/**
 * 直接上传小文件
 */
const directUpload = async (file, eventId, stage, onProgress) => {
  const url = getApiUrl(`/quality-events/${eventId}/upload?stage=${stage}`)
  console.log('[Upload] URL:', url)
  console.log('[Upload] isNative:', isNativePlatform())
  
  // 原生平台使用分片上传，获得真实进度
  if (isNativePlatform()) {
    const result = await nativeChunkUpload(url, file, onProgress)
    return result.data || result
  }
  
  // 浏览器保持原有方式
  const result = await browserUpload(url, file, onProgress)
  return result.data || result
}

/**
 * 浏览器上传（FormData + XMLHttpRequest）
 */
const browserUpload = async (url, file, onProgress) => {
  const token = getToken()
  const formData = new FormData()
  const isVideo = file.name.toLowerCase().endsWith('.mp4')
  if (isVideo) {
    const fakeName = file.name.replace(/\.mp4$/i, '.pdf') + '|ORIGINAL:' + file.name
    const fakeFile = new File([file], fakeName, { type: 'application/octet-stream' })
    formData.append('files', fakeFile)
  } else {
    formData.append('files', file)
  }
  
  // 使用 XMLHttpRequest 获取进度
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))
    
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

/**
 * 智能上传（小文件直接上传，大文件提示用 PC 端）
 */
export const smartUpload = async (file, eventId, eventNo, stage, onProgress) => {
  console.log('[smartUpload] file:', file.name, 'size:', file.size, 'platform:', isNativePlatform() ? 'native' : 'browser')
  
  // 原生平台限制 200MB（base64 编码后约 266MB）
  const NATIVE_MAX_SIZE = 200 * 1024 * 1024
  
  if (isNativePlatform() && file.size > NATIVE_MAX_SIZE) {
    throw new Error(`文件过大(${Math.round(file.size/1024/1024)}MB)，移动端暂不支持超过200MB的文件，请使用PC端上传`)
  }
  
  // 浏览器端限制 500MB
  if (!isNativePlatform() && file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小不能超过500MB`)
  }
  
  onProgress && onProgress(0)
  
  const result = await directUpload(file, eventId, stage, onProgress)
  
  onProgress && onProgress(100)
  return Array.isArray(result) ? result : [result]
}

/**
 * 批量智能上传
 */
export const batchSmartUpload = async (files, eventId, eventNo, stage, onProgress) => {
  const results = []
  const fileArray = Array.from(files)
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]
    
    const fileResult = await smartUpload(
      file,
      eventId,
      eventNo,
      stage,
      (percent) => {
        if (onProgress) {
          onProgress(i, percent, file.name, fileArray.length)
        }
      }
    )
    
    results.push(...fileResult)
  }
  
  return results
}

// 为了保持兼容性，导出这些函数（虽然内部不再使用）
export const uploadChunkWithRetry = async () => {
  throw new Error('分片上传已禁用')
}

export const getUploadedChunks = async () => {
  return []
}

export const initChunkUpload = async () => {
  throw new Error('分片上传已禁用')
}

export const mergeChunks = async () => {
  throw new Error('分片上传已禁用')
}

export const cancelUpload = async () => {
  // 什么都不做
}
