<template>
  <div class="p-4">
    <h1 class="text-2xl mb-4">响应式测试页面</h1>
    
    <div class="space-y-4">
      <div class="bg-gray-200 p-4">
        <p>当前屏幕宽度: {{ screenWidth }}px</p>
        <p>是否为小屏幕 (&lt;640px): {{ isSmallScreen ? '是' : '否' }}</p>
      </div>
      
      <button class="btn btn-sm sm:btn-md btn-primary">
        响应式按钮 (小屏:btn-sm 大屏:btn-md)
      </button>
      
      <div class="text-base sm:text-lg bg-blue-100 p-2">
        响应式文字 (小屏:text-base 大屏:text-lg)
      </div>
      
      <div class="p-3 sm:p-6 bg-green-100">
        响应式内边距 (小屏:p-3 大屏:p-6)
      </div>
      
      <div class="badge badge-sm sm:badge-lg badge-secondary">
        响应式徽章
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const screenWidth = ref(window.innerWidth)
const isSmallScreen = ref(window.innerWidth < 640)

function updateSize() {
  screenWidth.value = window.innerWidth
  isSmallScreen.value = window.innerWidth < 640
}

onMounted(() => {
  window.addEventListener('resize', updateSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
})
</script>