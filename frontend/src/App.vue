<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { checkAppVersion } from '@/utils/appUpdate'

onMounted(() => {
  // APP 启动时检查版本
  setTimeout(() => {
    checkAppVersion()
  }, 2000) // 延迟 2 秒检查，避免影响启动速度
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
  background-color: #f5f7fa;
}
</style>
