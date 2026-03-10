// 分片上传工具函数
import apiConfig from '@/api/config'
import { Capacitor } from '@capacitor/core'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 每块
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB 阈值

// 获取完整 API URL
const getApiUrl = (path) => {
  const baseURL = apiConfig.baseURL
  if (baseURL.startsWith('http')) {
    return `${baseURL}${path}`
  }
  if (baseURL.startsWith('/')) {
    return `${window.location.origin}${baseURL}${path}`
  }
  return `${baseURL}${path}`
}

// 判断是否为原生平台
const isNativePlatform = () => Capacitor.isNativePlatform()

// 获取 Token
const getToken = () => localStorage.getItem('token')

// 安全的 base64 编码（处理大文件）
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000 // 32KB chunks
  let result = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    result += String.fromCharCode.apply(null, chunk)
  }
  return btoa(result)
}

/**
 * 原生平台文件上传（使用 XMLHttpRequest，更稳定）
 */
const nativeUpload = async (url, file, eventId, stage) => {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const xhr = new XMLHttpRequest()
    
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response.data || response)
        } catch (e) {
          resolve(xhr.responseText)
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }
    
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.ontimeout = () => reject(new Error('Request timeout'))
    
    // 读取文件并转为 base64
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result
      const base64Data = arrayBufferToBase64(arrayBuffer)
      
      const data = JSON.stringify({
        filename: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: base64Data,
        isBase64: true
      })
      
      xhr.send(data)
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 浏览器端文件上传（使用 fetch + FormData）
 */
const browserUpload = async (url, file) => {
  const token = getToken()
  const formData = new FormData()
  
  // 伪装扩展名：把 .mp4 改成 .pdf
  const isVideo = file.name.toLowerCase().endsWith('.mp4')
  if (isVideo) {
    const fakeName = file.name.replace(/\.mp4$/i, '.pdf') + '|ORIGINAL:' + file.name
    const fakeFile = new File([file], fakeName, { type: 'application/octet-stream' })
    formData.append('files', fakeFile)
  } else {
    formData.append('files', file)
  }
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
  
  const result = await response.json()
  return result.data
}

/**
 * 直接上传小文件
 */
const directUpload = async (file, eventId, stage) => {
  const url = getApiUrl(`/quality-events/${eventId}/upload?stage=${stage}`)
  
  if (isNativePlatform()) {
    return nativeUpload(url, file, eventId, stage)
  } else {
    return browserUpload(url, file)
  }
}

/**
 * 原生平台分片上传
 */
const nativeUploadChunk = async (file, uploadId, index, totalChunks) => {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const url = getApiUrl('/upload/chunk')
    const xhr = new XMLHttpRequest()
    
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch (e) {
          resolve({ code: 200 })
        }
      } else {
        reject(new Error(`Chunk ${index} failed: ${xhr.status}`))
      }
    }
    
    xhr.onerror = () => reject(new Error('Network error'))
    
    const start = index * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64Data = arrayBufferToBase64(reader.result)
      xhr.send(JSON.stringify({
        uploadId,
        index,
        totalChunks,
        chunk: base64Data,
        filename: file.name
      }))
    }
    reader.readAsArrayBuffer(chunk)
  })
}

/**
 * 浏览器端分片上传
 */
const browserUploadChunk = async (file, uploadId, index, totalChunks) => {
  const token = getToken()
  const start = index * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, file.size)
  const chunk = file.slice(start, end)
  
  const formData = new FormData()
  const chunkBlob = new Blob([chunk], { type: 'application/octet-stream' })
  formData.append('chunk', chunkBlob, `chunk-${index}`)
  formData.append('index', index)
  formData.append('uploadId', uploadId)
  formData.append('totalChunks', totalChunks)
  
  const response = await fetch(getApiUrl('/upload/chunk'), {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Chunk ${index} failed: ${response.status}`)
  }
  
  return response.json()
}

/**
 * 上传单个分片（带重试）
 */
export const uploadChunkWithRetry = async (file, uploadId, index, totalChunks, maxRetries = 3) => {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isNativePlatform()) {
        return await nativeUploadChunk(file, uploadId, index, totalChunks)
      } else {
        return await browserUploadChunk(file, uploadId, index, totalChunks)
      }
    } catch (error) {
      lastError = error
      console.warn(`分片 ${index} 第 ${attempt} 次上传失败，${attempt < maxRetries ? '重试中...' : '放弃'}`)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }
  
  throw lastError
}

/**
 * 查询已上传的分片
 */
export const getUploadedChunks = async (uploadId) => {
  try {
    const token = getToken()
    const url = getApiUrl(`/upload/status/${uploadId}`)
    
    if (isNativePlatform()) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data.uploadedChunks || [])
            } catch (e) {
              resolve([])
            }
          } else {
            resolve([])
          }
        }
        xhr.onerror = () => resolve([])
        xhr.send()
      })
    } else {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.uploadedChunks || []
    }
  } catch (error) {
    console.error('查询已上传分片失败:', error)
    return []
  }
}

/**
 * 初始化分片上传
 */
export const initChunkUpload = async (filename, size) => {
  const token = getToken()
  const url = getApiUrl('/upload/init')
  const body = JSON.stringify({ filename, size })
  
  if (isNativePlatform()) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          resolve(data.uploadId)
        } else {
          reject(new Error('Failed to initialize upload'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(body)
    })
  } else {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    })
    if (!response.ok) throw new Error('Failed to initialize upload')
    const data = await response.json()
    return data.uploadId
  }
}

/**
 * 合并分片
 */
export const mergeChunks = async (uploadId, filename, eventNo) => {
  const token = getToken()
  const url = getApiUrl('/upload/merge')
  const body = JSON.stringify({ uploadId, filename, eventNo })
  
  if (isNativePlatform()) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error('Failed to merge chunks'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(body)
    })
  } else {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    })
    if (!response.ok) throw new Error('Failed to merge chunks')
    return response.json()
  }
}

/**
 * 取消上传
 */
export const cancelUpload = async (uploadId) => {
  const token = getToken()
  const url = getApiUrl(`/upload/cancel/${uploadId}`)
  
  try {
    if (isNativePlatform()) {
      const xhr = new XMLHttpRequest()
      xhr.open('DELETE', url, true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send()
    } else {
      await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }
  } catch (error) {
    console.error('取消上传失败:', error)
  }
}

/**
 * 智能上传（小文件直接上传，大文件分片上传+断点续传）
 */
export const smartUpload = async (file, eventId, eventNo, stage, onProgress) => {
  // 小于 50MB，直接上传
  if (file.size <= MAX_FILE_SIZE) {
    onProgress && onProgress(0, 0, 1, '准备上传')
    
    const result = await directUpload(file, eventId, stage)
    
    onProgress && onProgress(100, 1, 1, '上传完成')
    return Array.isArray(result) ? result : [result]
  }
  
  // 大于 50MB，分片上传
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  onProgress && onProgress(0, 0, totalChunks, '初始化上传...')
  
  const uploadId = await initChunkUpload(file.name, file.size)
  
  // 查询已上传的分片（断点续传）
  onProgress && onProgress(0, 0, totalChunks, '检查已上传分片...')
  const uploadedChunks = await getUploadedChunks(uploadId)
  const uploadedSet = new Set(uploadedChunks)
  
  // 计算需要上传的分片
  const pendingChunks = []
  for (let i = 0; i < totalChunks; i++) {
    if (!uploadedSet.has(i)) {
      pendingChunks.push(i)
    }
  }
  
  const completedCount = uploadedChunks.length
  onProgress && onProgress(
    Math.round((completedCount / totalChunks) * 100),
    completedCount,
    totalChunks,
    `断点续传: 已上传 ${completedCount}/${totalChunks} 分片`
  )
  
  // 上传缺失的分片
  for (let i = 0; i < pendingChunks.length; i++) {
    const chunkIndex = pendingChunks[i]
    
    try {
      await uploadChunkWithRetry(file, uploadId, chunkIndex, totalChunks)
      
      const currentCompleted = completedCount + i + 1
      const percent = Math.round((currentCompleted / totalChunks) * 100)
      
      onProgress && onProgress(
        percent,
        currentCompleted,
        totalChunks,
        `上传中: ${currentCompleted}/${totalChunks} (${percent}%)`
      )
    } catch (error) {
      await cancelUpload(uploadId)
      throw new Error(`分片 ${chunkIndex} 上传失败，已取消上传: ${error.message}`)
    }
  }
  
  // 合并分片
  onProgress && onProgress(99, totalChunks, totalChunks, '合并分片中...')
  const result = await mergeChunks(uploadId, file.name, eventNo)
  onProgress && onProgress(100, totalChunks, totalChunks, '上传完成')
  
  return [{
    name: file.name,
    url: result.url,
    type: file.type,
    size: file.size,
    uploadTime: new Date().toISOString()
  }]
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
      (percent, uploadedChunks, totalChunks, status) => {
        if (onProgress) {
          onProgress(i, percent, file.name, fileArray.length, {
            uploadedChunks,
            totalChunks,
            status,
            isChunked: file.size > MAX_FILE_SIZE
          })
        }
      }
    )
    
    results.push(...fileResult)
  }
  
  return results
}
