<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Header -->
    <header class="navbar glass">
      <div class="navbar-start">
        <button 
          @click="goBack" 
          class="btn btn-ghost btn-circle focusable"
        >
          <ArrowLeftIcon class="w-6 h-6" />
        </button>
      </div>
      <div class="navbar-center">
        <div class="text-center">
          <h1 class="text-xl font-bold">{{ gameTitle }}</h1>
          <p class="text-sm opacity-70">{{ streamName }}</p>
        </div>
      </div>
      <div class="navbar-end">
        <button 
          @click="openInNewTab" 
          class="btn btn-ghost btn-circle focusable"
          title="在新标签页中打开"
        >
          <ArrowTopRightOnSquareIcon class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- Iframe Container -->
    <div class="flex-1 relative bg-black">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="loading loading-spinner loading-lg text-white"></div>
          <p class="mt-4 text-white">正在加载直播页面...</p>
        </div>
      </div>
      
      <div v-if="iframeError" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center max-w-md">
          <ExclamationTriangleIcon class="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 class="text-xl font-bold text-white mb-2">无法加载嵌入式播放器</h2>
          <p class="text-white/70 mb-4">{{ errorMessage }}</p>
          <button @click="openInNewTab" class="btn btn-primary">
            在新标签页中打开
          </button>
        </div>
      </div>
      
      <!-- 使用 iframe 显示完整页面 -->
      <iframe
        v-show="!loading && !iframeError"
        :src="iframeUrl"
        class="w-full h-full"
        frameborder="0"
        allowfullscreen
        @load="onIframeLoad"
        @error="onIframeError"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      ></iframe>
    </div>

    <!-- Info Bar -->
    <div class="p-4 bg-base-100">
      <div class="max-w-4xl mx-auto">
        <div class="alert alert-info">
          <InfoCircleIcon class="w-6 h-6" />
          <div>
            <p>正在通过嵌入式页面播放，如遇到问题请点击右上角在新标签页中打开</p>
            <p class="text-sm opacity-70 mt-1">某些直播源可能需要在原网站观看</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon as InfoCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const iframeUrl = ref('')
const iframeError = ref(false)
const errorMessage = ref('')

const gameTitle = computed(() => {
  const { team1, team2 } = route.query
  return team1 && team2 ? `${team1} VS ${team2}` : '直播'
})

const streamName = computed(() => {
  return route.query.name || '直播源'
})

function goBack() {
  router.back()
}

function openInNewTab() {
  // 在新标签页中打开原始URL
  const originalUrl = route.query.url
  if (originalUrl) {
    window.open(originalUrl, '_blank')
  }
}

function onIframeLoad() {
  loading.value = false
  console.log('Iframe 加载完成')
  
  // 设置一个定时器检查iframe是否真正加载成功
  setTimeout(() => {
    checkIframeContent()
  }, 1000)
}

function onIframeError() {
  loading.value = false
  iframeError.value = true
  errorMessage.value = '该直播源设置了防嵌入保护，请点击下方按钮在新标签页中观看'
  console.error('Iframe 加载失败')
}

function checkIframeContent() {
  // 检查是否是纬来体育等特殊源
  const { url, name } = route.query
  if (name && name.includes('纬来')) {
    iframeError.value = true
    errorMessage.value = '纬来体育设置了防嵌入保护，请点击下方按钮在新标签页中观看'
  }
}

onMounted(() => {
  const { url } = route.query
  if (url) {
    // 使用代理URL来绕过referer限制
    iframeUrl.value = `/proxy/iframe?url=${encodeURIComponent(url)}`
    console.log('加载代理 iframe URL:', iframeUrl.value)
  }
})
</script>

<style scoped>
iframe {
  border: none;
  background: black;
}
</style>