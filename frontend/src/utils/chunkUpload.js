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
 * 统一的上传函数（浏览器和原生平台通用）
 */
const unifiedUpload = async (url, file, onProgress) => {
  const token = getToken()
  console.log('[unifiedUpload] URL:', url)
  console.log('[unifiedUpload] Token exists:', !!token)
  
  // 原生平台：使用 base64 + fetch
  if (isNativePlatform()) {
    console.log('[unifiedUpload] Native platform, using base64')
    
    // 先测试连接
    const isConnected = await testServerConnection(url)
    if (!isConnected) {
      throw new Error('无法连接到服务器，请检查网络或服务器地址')
    }
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      console.log('[unifiedUpload] File read, size:', arrayBuffer.byteLength)
      
      const base64Data = arrayBufferToBase64(arrayBuffer)
      console.log('[unifiedUpload] Base64 encoded, length:', base64Data.length)
      
      const body = JSON.stringify({
        filename: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: base64Data,
        isBase64: true
      })
      console.log('[unifiedUpload] Request body size:', body.length)
      
      console.log('[unifiedUpload] Sending request with progress...')
      
      // 使用 XMLHttpRequest 以支持上传进度
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        let progressInterval = null
        let simulatedProgress = 0
        
        // 开始模拟进度（因为 base64 编码后的数据是一次性发送的）
        const startProgressSimulation = () => {
          progressInterval = setInterval(() => {
            if (simulatedProgress < 90) {
              simulatedProgress += Math.random() * 10
              if (simulatedProgress > 90) simulatedProgress = 90
              if (onProgress) {
                console.log(`[Upload] Simulated Progress: ${Math.round(simulatedProgress)}%`)
                onProgress(Math.round(simulatedProgress))
              }
            }
          }, 200)
        }
        
        // 停止模拟进度
        const stopProgressSimulation = () => {
          if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
          }
        }
        
        // 上传进度监听（可能不会触发，因为是一次性发送）
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100)
            console.log(`[Upload] Real Progress: ${percent}%`)
            onProgress(percent)
          }
        }
        
        xhr.onloadstart = () => {
          startProgressSimulation()
        }
        
        xhr.onload = () => {
          stopProgressSimulation()
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch (e) {
              reject(new Error('Invalid response'))
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        
        xhr.onerror = () => {
          stopProgressSimulation()
          reject(new Error('Network error'))
        }
        xhr.ontimeout = () => {
          stopProgressSimulation()
          reject(new Error('Request timeout'))
        }
        
        xhr.open('POST', url, true)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(body)
      })
      
      console.log('[unifiedUpload] Success:', result)
      return result
    } catch (error) {
      console.error('[unifiedUpload] Error:', error)
      throw error
    }
  }
  
  // 浏览器：使用 FormData + fetch
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
 * 直接上传小文件
 */
const directUpload = async (file, eventId, stage, onProgress) => {
  const url = getApiUrl(`/quality-events/${eventId}/upload?stage=${stage}`)
  console.log('[Upload] URL:', url)
  console.log('[Upload] isNative:', isNativePlatform())
  
  const result = await unifiedUpload(url, file, onProgress)
  return result.data || result
}

/**
 * 智能上传（小文件直接上传，大文件提示用 PC 端）
 */
export const smartUpload = async (file, eventId, eventNo, stage, onProgress) => {
  console.log('[smartUpload] file:', file.name, 'size:', file.size, 'platform:', isNativePlatform() ? 'native' : 'browser')
  
  // 原生平台限制 200MB（base64 编码后约 266MB）
  const NATIVE_MAX_SIZE = 200 * 1024 * 1024
  
  if (isNativePlatform() && file.size > NATIVE_MAX_SIZE) {
    throw new Error(`文件过大(${Math.round(file.size/1024/1024)}MB)，安卓端暂不支持超过100MB的文件，请使用PC端上传`)
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
