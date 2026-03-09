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
import { smartUpload } from '@/utils/chunkUpload'

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
  const link = document.createElement('a')
  link.href = getFileUrl(file.url)
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
  return `/api/download?filename=${encodeURIComponent(`${eventNo}/${filename}`)}`
}

const deleteFile = async (index) => {
  const file = localFiles.value[index]
  if (!file) return
  
  // 调用后端删除物理文件
  try {
    const filename = file.url.split('/').pop()
    const eventNo = file.url.split('/')[3] // 从 /uploads/quality-events/QE-xxx/filename 提取事件编号
    const filePath = `${eventNo}/${filename}`
    
    await fetch('/api/files', {
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
  
  uploading.value = true
  uploadProgress.value = 0
  uploadingFileName.value = file.name
  isChunkedUpload.value = file.size > 50 * 1024 * 1024
  
  try {
    const result = await smartUpload(
      file,
      props.eventId,
      props.eventNo,
      props.stage,
      (percent, uploadedChunks, totalChunks, status) => {
        uploadProgress.value = percent
        // 更新进度
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
    
    // 添加新文件到本地列表
    const newFile = result[0]
    localFiles.value.push(newFile)
    emit('upload-success', { code: 200, data: result }, file)
    emit('update:files', [...localFiles.value])
    
    onSuccess({ code: 200, data: result })
  } catch (error) {
    uploading.value = false
    uploadProgress.value = 0
    uploadingFileName.value = ''
    
    console.error('上传失败:', error)
    ElMessage.error(error.message || '文件上传失败')
    onError(error)
  }
}

const beforeUpload = (file) => {
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB!')
    return false
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
  word-break: break-all;
  line-height: 1.5;
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
