<template>
  <div v-if="visible" class="screen-logger">
    <div class="logger-header">
      <span>调试日志</span>
      <div class="logger-actions">
        <el-button link size="small" @click="clearLogs">清空</el-button>
        <el-button link size="small" @click="visible = false">关闭</el-button>
      </div>
    </div>
    <div class="logger-content" ref="logContent">
      <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
        <span class="log-time">{{ log.time }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const visible = ref(false)
const logs = ref([])
const logContent = ref(null)

// 切换显示/隐藏
const toggle = () => {
  visible.value = !visible.value
}

// 添加日志
const addLog = (message, type = 'info') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
  
  // 安全地转换消息为字符串
  let msgStr
  if (typeof message === 'object' && message !== null) {
    try {
      // 尝试使用安全的方式序列化
      msgStr = JSON.stringify(message, (key, value) => {
        // 跳过循环引用和函数
        if (typeof value === 'function') return '[Function]'
        if (value instanceof Error) return value.message
        if (key === 'vnode' || key === 'component' || key === 'el' || key === 'refs') return '[VueInternal]'
        return value
      })
    } catch (e) {
      // 如果序列化失败，使用简单字符串表示
      msgStr = '[Object: ' + Object.prototype.toString.call(message).slice(8, -1) + ']'
    }
  } else {
    msgStr = String(message)
  }
  
  logs.value.push({
    time,
    message: msgStr,
    type
  })
  
  // 最多保留 100 条
  if (logs.value.length > 100) {
    logs.value.shift()
  }
  
  // 自动滚动到底部
  nextTick(() => {
    if (logContent.value) {
      logContent.value.scrollTop = logContent.value.scrollHeight
    }
  })
}

// 清空日志
const clearLogs = () => {
  logs.value = []
}

// 暴露给全局使用
window.screenLog = addLog
window.toggleScreenLogger = toggle

// 捕获 console 输出
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = (...args) => {
  originalLog.apply(console, args)
  args.forEach(arg => addLog(arg, 'info'))
}

console.error = (...args) => {
  originalError.apply(console, args)
  args.forEach(arg => addLog(arg, 'error'))
}

console.warn = (...args) => {
  originalWarn.apply(console, args)
  args.forEach(arg => addLog(arg, 'warn'))
}
</script>

<style scoped>
.screen-logger {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  height: 60vh;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  color: #fff;
  font-size: 12px;
}

.logger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #333;
  font-weight: bold;
}

.logger-actions {
  display: flex;
  gap: 10px;
}

.logger-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  font-family: monospace;
}

.log-item {
  margin-bottom: 5px;
  word-break: break-all;
  line-height: 1.4;
}

.log-time {
  color: #888;
  margin-right: 8px;
  font-size: 11px;
}

.log-item.info .log-message {
  color: #fff;
}

.log-item.error .log-message {
  color: #ff6b6b;
}

.log-item.warn .log-message {
  color: #ffd93d;
}
</style>
