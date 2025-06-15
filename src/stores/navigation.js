import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  const currentFocus = ref(0)
  const focusableElements = ref([])
  const isNavigating = ref(false)
  
  // 检测是否为TV设备
  const isTvDevice = ref(false)
  
  function checkTvDevice() {
    // 检测Apple TV、Android TV等
    const userAgent = navigator.userAgent.toLowerCase()
    isTvDevice.value = 
      userAgent.includes('appletv') ||
      userAgent.includes('android tv') ||
      userAgent.includes('smart-tv') ||
      userAgent.includes('netcast') ||
      window.innerWidth >= 1920 // 大屏幕设备
  }
  
  function updateFocusableElements() {
    const elements = Array.from(document.querySelectorAll('.focusable:not([disabled])'))
    focusableElements.value = elements.filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
  }
  
  function focusElement(index) {
    if (index >= 0 && index < focusableElements.value.length) {
      currentFocus.value = index
      focusableElements.value[index].focus()
      
      // 确保元素在视口内
      focusableElements.value[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }
  
  function navigate(direction) {
    if (isNavigating.value) return
    isNavigating.value = true
    
    const current = focusableElements.value[currentFocus.value]
    const currentRect = current?.getBoundingClientRect()
    
    if (!currentRect) {
      isNavigating.value = false
      return
    }
    
    let bestCandidate = null
    let bestScore = Infinity
    
    focusableElements.value.forEach((element, index) => {
      if (index === currentFocus.value) return
      
      const rect = element.getBoundingClientRect()
      const score = calculateScore(currentRect, rect, direction)
      
      if (score < bestScore) {
        bestScore = score
        bestCandidate = index
      }
    })
    
    if (bestCandidate !== null) {
      focusElement(bestCandidate)
    }
    
    setTimeout(() => {
      isNavigating.value = false
    }, 100)
  }
  
  function calculateScore(from, to, direction) {
    const fromCenter = {
      x: from.left + from.width / 2,
      y: from.top + from.height / 2
    }
    
    const toCenter = {
      x: to.left + to.width / 2,
      y: to.top + to.height / 2
    }
    
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    
    // 根据方向计算分数
    switch (direction) {
      case 'up':
        if (dy >= 0) return Infinity
        return Math.abs(dx) + Math.abs(dy) * 0.5
      case 'down':
        if (dy <= 0) return Infinity
        return Math.abs(dx) + Math.abs(dy) * 0.5
      case 'left':
        if (dx >= 0) return Infinity
        return Math.abs(dy) + Math.abs(dx) * 0.5
      case 'right':
        if (dx <= 0) return Infinity
        return Math.abs(dy) + Math.abs(dx) * 0.5
      default:
        return Infinity
    }
  }
  
  function handleKeydown(event) {
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Enter': 'select',
      ' ': 'select',
      'Escape': 'back'
    }
    
    const action = keyMap[event.key]
    if (!action) return
    
    event.preventDefault()
    
    if (action === 'select') {
      const current = focusableElements.value[currentFocus.value]
      current?.click()
    } else if (action === 'back') {
      window.history.back()
    } else {
      navigate(action)
    }
  }
  
  function initialize() {
    checkTvDevice()
    
    // 设置键盘事件监听
    window.addEventListener('keydown', handleKeydown)
    
    // 监听DOM变化
    const observer = new MutationObserver(() => {
      updateFocusableElements()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // 初始化时更新元素
    nextTick(() => {
      updateFocusableElements()
      if (focusableElements.value.length > 0) {
        focusElement(0)
      }
    })
  }
  
  return {
    currentFocus,
    focusableElements,
    isTvDevice,
    isNavigating,
    initialize,
    updateFocusableElements,
    focusElement,
    navigate
  }
})