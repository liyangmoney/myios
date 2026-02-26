<template>
  <div class="onlyoffice-preview">
    <div v-if="loading" class="loading">
      <el-spin size="large" />
      <p>正在加载文档...请稍候</p>
    </div>
    
    <div v-else-if="error" class="error">
      <el-alert :title="error" type="error" show-icon />
      <el-button @click="$router.back()" style="margin-top: 20px">返回</el-button>
    </div>
    
    <div v-else id="onlyoffice-editor" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const docEditor = ref(null)

// 加载 OnlyOffice 脚本
const loadOnlyOfficeScript = () => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.DocsAPI) {
      resolve()
      return
    }
    
    // 动态加载 OnlyOffice API
    const script = document.createElement('script')
    script.src = 'http://localhost:9000/web-apps/apps/api/documents/api.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('加载 OnlyOffice 失败，请确保服务已启动'))
    document.head.appendChild(script)
  })
}

// 初始化编辑器
const initEditor = async () => {
  const recordId = route.params.id
  
  if (!recordId) {
    error.value = '缺少文档ID'
    loading.value = false
    return
  }
  
  try {
    // 加载 OnlyOffice 脚本
    await loadOnlyOfficeScript()
    
    // 获取文档配置
    const res = await api.get(`/onlyoffice/config/${recordId}`)
    
    if (res.code !== 200) {
      throw new Error(res.message || '获取文档配置失败')
    }
    
    const config = res.data
    
    // 初始化 OnlyOffice 编辑器
    docEditor.value = new window.DocsAPI.DocEditor('onlyoffice-editor', {
      document: config.document,
      documentType: config.documentType,
      editorConfig: config.editorConfig,
      events: {
        onReady: () => {
          console.log('OnlyOffice 编辑器已就绪')
          loading.value = false
        },
        onDocumentStateChange: (event) => {
          console.log('文档状态变化:', event.data)
        },
        onError: (event) => {
          console.error('OnlyOffice 错误:', event)
          error.value = '编辑器错误: ' + (event.data || '未知错误')
          loading.value = false
        }
      }
    })
    
  } catch (err) {
    console.error('初始化编辑器失败:', err)
    error.value = err.message || '加载文档失败'
    loading.value = false
    ElMessage.error(error.value)
  }
}

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  // 销毁编辑器
  if (docEditor.value) {
    docEditor.value.destroyEditor()
  }
})
</script>

<style scoped>
.onlyoffice-preview {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.error {
  padding: 40px;
  text-align: center;
}

.editor-container {
  flex: 1;
  height: 100%;
}
</style>