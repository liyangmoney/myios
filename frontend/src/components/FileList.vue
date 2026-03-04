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
      class="upload-section"
      :action="uploadUrl"
      :headers="uploadHeaders"
      name="files"
      :multiple="true"
      :limit="5"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
    >
      <el-button type="primary" :icon="Upload">上传文件</el-button>
      <template #tip>
        <div class="upload-tip">
          支持图片、PDF、Word、Excel、MP4，单个文件不超过500MB
        </div>
      </template>
    </el-upload>
    
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

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  eventId: {
    type: [String, Number],
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

// 监听 prop 变化，同步更新本地副本
watch(() => props.files, (newFiles) => {
  localFiles.value = [...newFiles]
}, { deep: true })

const previewVisible = ref(false)
const previewUrl = ref('')

const uploadUrl = computed(() => {
  return `/api/quality-events/${props.eventId}/upload?stage=${props.stage}`
})

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
  // 提取文件名，使用下载接口
  const filename = url.split('/').pop()
  return `/api/download?filename=${encodeURIComponent(filename)}`
}

const deleteFile = async (index) => {
  // 从本地列表中删除
  localFiles.value.splice(index, 1)
  // 通知父组件更新
  emit('update:files', [...localFiles.value])
  ElMessage.success('文件已删除')
}

const beforeUpload = (file) => {
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response, file) => {
  ElMessage.success('文件上传成功')
  if (response.code === 200 && response.data && response.data.length > 0) {
    // 添加新文件到本地列表
    const newFile = {
      name: response.data[0].name || file.name,
      url: response.data[0].url,
      type: response.data[0].type || file.raw?.type || '',
      size: response.data[0].size || file.size
    }
    localFiles.value.push(newFile)
    // 通知父组件
    emit('upload-success', response, file)
    emit('update:files', [...localFiles.value])
  }
}

const handleUploadError = (error) => {
  console.error('上传失败:', error)
  let message = '文件上传失败'
  
  // 处理后端返回的JSON字符串
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error)
      if (parsed.message) {
        message = parsed.message
      }
    } catch {
      message = error
    }
  } else if (error?.response?.data?.message) {
    message = error.response.data.message
  } else if (error?.response?.data) {
    // 尝试从data中提取message
    const data = error.response.data
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        if (parsed.message) {
          message = parsed.message
        }
      } catch {
        message = data
      }
    }
  } else if (error?.message) {
    message = error.message
  }
  
  ElMessage.error(message)
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
</style>
