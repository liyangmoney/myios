import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 检测是否为移动设备
 * @returns {boolean}
 */
export function useMobile() {
  const isMobile = ref(false)
  
  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }
  
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
  
  return isMobile
}

/**
 * 检测是否为平板设备
 * @returns {boolean}
 */
export function useTablet() {
  const isTablet = ref(false)
  
  const checkTablet = () => {
    const width = window.innerWidth
    isTablet.value = width > 768 && width <= 1024
  }
  
  onMounted(() => {
    checkTablet()
    window.addEventListener('resize', checkTablet)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkTablet)
  })
  
  return isTablet
}
