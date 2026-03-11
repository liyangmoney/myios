<template>
  <div class="file-list">
    <!-- 文件列表 -->
    <div v-if="localFiles.length > 0" class="files-container">
      <div v-for="(file, index) in localFiles" :key="index" class="file-item">
        <div class="file-info" @click="previewFile(file)">
          <el-icon class="file-icon">
            <Document v-if="isDocument(file.type)" />
            <Picture v-else-if="isImage(file.type)" />
            <Folder v-else />
          </el-icon>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        <div class="file-actions">
          <el-button link type="primary" @click="downloadFile(file)">下载</el-button>
          <el-button v-if="canUpload" link type="danger" @click="deleteFile(index)">删除</el-button>
        </div>
      </div>
    </div>
    
    <div v-else class="no-files">
      暂无附件
    </div>
    
    <!-- 上传按钮 -->
    <el-upload
      v-if="canUpload"
      ref="uploadRef"
      class="upload-section"
      :http-request="customUpload"
      :headers="uploadHeaders"
      name="files"
      :multiple="true"
      :limit="5"
      :show-file-list="false"
      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4"
      :before-upload="beforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-progress="handleUploadProgress"
    >
      <el-button type="primary" :icon="Upload" :loading="uploading">上传文件</el-button>
      <template #tip>
        <div class="upload-tip">
          支持图片、PDF、Word、Excel、MP4，单个文件不超过500MB
        </div>
      </template>
    </el-upload>
    
    <!-- 上传进度条 -->
    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
      <el-progress :percentage="uploadProgress" :stroke-width="8" />
      <span class="progress-text">{{ uploadingFileName }}</span>
    </div>
    
    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="80%"
      center
    >
      <img :src="previewUrl" style="width: 100%; max-height: 70vh; object-fit: contain;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Picture, Folder, Upload } from '@element-plus/icons-vue'
import { qualityEventApi } from '@/api'
import apiConfig from '@/api/config'
import { smartUpload } from '@/utils/chunkUpload'
import { Capacitor } from '@capacitor/core'

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  eventId: {
    type: [String, Number],
    required: true
  },
  eventNo: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    required: true
  },
  canUpload: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['upload-success', 'update:files'])

// 本地文件列表副本
const localFiles = ref([...props.files])
const uploadRef = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadingFileName = ref('')
const isChunkedUpload = ref(false)

// 监听 prop 变化，同步更新本地副本
watch(() => props.files, (newFiles) => {
  localFiles.value = [...newFiles]
}, { deep: true })

const previewVisible = ref(false)
const previewUrl = ref('')

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`
  }
})

const isImage = (type) => {
  return type && type.startsWith('image/')
}

const isDocument = (type) => {
  return type && (type.includes('pdf') || type.includes('word') || type.includes('excel'))
}

const formatFileSize = (size) => {
  if (!size) return ''
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const previewFile = (file) => {
  if (isImage(file.type)) {
    previewUrl.value = getFileUrl(file.url)
    previewVisible.value = true
  } else {
    // 非图片文件直接下载
    downloadFile(file)
  }
}

const downloadFile = (file) => {
  // 使用完整 URL
  const apiUrl = apiConfig?.baseURL || ''
  const baseUrl = apiUrl.replace('/api', '')
  const fullUrl = file.url.startsWith('http') ? file.url : baseUrl + file.url
  
  // 在APP中使用系统浏览器打开
  if (typeof window !== 'undefined' && window.Capacitor) {
    import('@capacitor/browser').then(({ Browser }) => {
      Browser.open({ url: fullUrl })
    })
  } else {
    // 网页端下载
    const link = document.createElement('a')
    link.href = fullUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 获取完整文件URL
const getFileUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  
  // 提取事件编号/文件名路径，使用下载接口
  // URL格式: /uploads/quality-events/QE-xxx/filename.ext
  const parts = url.split('/')
  const eventNo = parts[parts.length - 2] // 倒数第二是事件编号
  const filename = parts[parts.length - 1] // 最后是文件名
  const downloadPath = `/api/download?filename=${encodeURIComponent(`${eventNo}/${filename}`)}`
  
  // 安卓端需要完整 URL
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    // 使用后端默认地址
    return `http://myjghy.myds.me:9090${downloadPath}`
  }
  
  return downloadPath
}

const deleteFile = async (index) => {
  const file = localFiles.value[index]
  if (!file) return
  
  // 调用后端删除物理文件
  try {
    const filename = file.url.split('/').pop()
    const eventNo = file.url.split('/')[3] // 从 /uploads/quality-events/QE-xxx/filename 提取事件编号
    const filePath = `${eventNo}/${filename}`
    
    // 使用完整 URL
    const apiUrl = apiConfig?.baseURL || ''
    await fetch(`${apiUrl.replace('/api', '')}/api/files`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ filename: filePath })
    })
  } catch (error) {
    console.error('删除物理文件失败:', error)
  }
  
  // 从本地列表中删除
  localFiles.value.splice(index, 1)
  // 通知父组件更新
  emit('update:files', [...localFiles.value])
  ElMessage.success('文件已删除')
}

// 自定义上传方法 - 使用智能分片上传
const customUpload = async (options) => {
  const { file, onProgress, onSuccess, onError } = options
  
  console.log('开始上传:', file.name, '大小:', file.size, '类型:', file.type)
  
  uploading.value = true
  uploadProgress.value = 0
  uploadingFileName.value = file.name
  isChunkedUpload.value = file.size > 50 * 1024 * 1024
  
  try {
    // 验证 eventId 和 eventNo
    if (!props.eventId || !props.eventNo) {
      throw new Error('缺少必要参数: eventId 或 eventNo')
    }
    
    console.log('调用 smartUpload:', {
      eventId: props.eventId,
      eventNo: props.eventNo,
      stage: props.stage
    })
    
    const result = await smartUpload(
      file,
      props.eventId,
      props.eventNo,
      props.stage,
      (percent, uploadedChunks, totalChunks, status) => {
        uploadProgress.value = percent
        onProgress({ percent })
      }
    )
    
    uploading.value = false
    uploadProgress.value = 100
    
    setTimeout(() => {
      uploadProgress.value = 0
      uploadingFileName.value = ''
    }, 1000)
    
    ElMessage.success('文件上传成功')
    
    const newFile = result[0]
    localFiles.value.push(newFile)
    emit('upload-success', { code: 200, data: result }, file)
    emit('update:files', [...localFiles.value])
    
    onSuccess({ code: 200, data: result })
  } catch (error) {
    uploading.value = false
    uploadProgress.value = 0
    uploadingFileName.value = ''
    
    console.error('上传失败详情:', error)
    ElMessage.error(error.message || '文件上传失败')
    onError(error)
  }
}

// 全局错误处理，防止页面崩溃
window.addEventListener('error', (e) => {
  console.error('全局错误:', e.message, e.filename, e.lineno)
  ElMessage.error('发生错误: ' + e.message)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('未处理的Promise错误:', e.reason)
  ElMessage.error('发生错误: ' + (e.reason?.message || '未知错误'))
})

const beforeUpload = async (file) => {
  console.log('准备上传文件:', file.name, '类型:', file.type, '大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
  
  // 检查文件大小（原生平台限制200MB，浏览器限制500MB）
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()
  const maxSize = isNative ? 200 : 500 // MB
  const fileSizeMB = file.size / 1024 / 1024
  
  if (fileSizeMB > maxSize) {
    const msg = isNative 
      ? `文件过大(${Math.round(fileSizeMB)}MB)，安卓端暂不支持超过200MB的文件，请使用PC端上传`
      : `文件大小不能超过500MB!`
    ElMessage.error(msg)
    return false
  }
  
  // 检查文件类型（包括手机视频的常见格式）
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.mp4', '.mov', '.3gp', '.m4v']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  
  if (!allowedExts.includes(ext)) {
    ElMessage.error(`不支持的文件格式: ${ext}`)
    console.error('文件类型不支持:', ext, file)
    return false
  }
  
  // 大文件提示（仅浏览器端）
  if (!isNative && file.size > 50 * 1024 * 1024) {
    ElMessage.info('文件较大，正在准备上传...')
  }
  
  return true
}

const handleUploadProgress = (event, file) => {
  // 普通上传的进度，分片上传在 customUpload 中处理
  if (!isChunkedUpload.value) {
    uploadProgress.value = Math.round(event.percent)
  }
}

const handleUploadSuccess = (response, file) => {
  // 已经在 customUpload 中处理
}

const handleUploadError = (error) => {
  // 已经在 customUpload 中处理
}
</script>

<style scoped>
.file-list {
  width: 100%;
}

.files-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  gap: 8px;
}

.file-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 20px;
  color: #409eff;
  flex-shrink: 0;
  margin-top: 2px;
}

.file-name {
  flex: 1;
  color: #303133;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.file-size {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: flex-start;
  padding-top: 2px;
}

.no-files {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}

.upload-section {
  margin-top: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.upload-progress {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}
</style>
