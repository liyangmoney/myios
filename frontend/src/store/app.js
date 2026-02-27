import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // 当前选中的年份，默认为当前年度
  const currentYear = ref(new Date().getFullYear())
  
  // 设置当前年份
  const setCurrentYear = (year) => {
    currentYear.value = year
    // 保存到 localStorage，刷新页面后保持
    localStorage.setItem('currentYear', year.toString())
  }
  
  // 从 localStorage 恢复年份
  const restoreYear = () => {
    const savedYear = localStorage.getItem('currentYear')
    if (savedYear) {
      currentYear.value = parseInt(savedYear)
    }
  }
  
  // 初始化
  restoreYear()
  
  return {
    currentYear,
    setCurrentYear,
    restoreYear
  }
})