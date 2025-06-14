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
          @click="toggleFullscreen" 
          class="btn btn-ghost btn-circle focusable"
        >
          <ArrowsPointingOutIcon v-if="!isFullscreen" class="w-6 h-6" />
          <ArrowsPointingInIcon v-else class="w-6 h-6" />
        </button>
      </div>
    </header>

    <!-- Player Container -->
    <div class="flex-1 relative bg-black">
      <div class="absolute inset-0 flex items-center justify-center">
        <!-- Loading -->
        <div v-if="loading" class="text-center">
          <div class="loading loading-spinner loading-lg text-white"></div>
          <p class="mt-4 text-white">正在加载直播流...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center max-w-md">
          <ExclamationTriangleIcon class="w-16 h-16 text-error mx-auto mb-4" />
          <h2 class="text-xl font-bold text-white mb-2">播放失败</h2>
          <p class="text-white/70 mb-4">{{ error }}</p>
          <button @click="retry" class="btn btn-primary focusable">
            重试
          </button>
        </div>

        <!-- Video Player -->
        <video
          v-show="!loading && !error"
          ref="videoRef"
          class="w-full h-full"
          controls
          autoplay
        ></video>
      </div>

      <!-- Player Controls Overlay -->
      <div 
        v-if="showControls && !loading && !error" 
        class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
      >
        <div class="flex items-center gap-4">
          <button 
            @click="togglePlay" 
            class="btn btn-circle btn-primary focusable"
          >
            <PlayIcon v-if="!isPlaying" class="w-6 h-6" />
            <PauseIcon v-else class="w-6 h-6" />
          </button>
          
          <div class="flex-1">
            <div class="text-white text-sm mb-1">
              {{ currentQuality }}
            </div>
          </div>
          
          <button 
            @click="showQualityMenu = !showQualityMenu" 
            class="btn btn-ghost btn-sm focusable"
          >
            <Cog6ToothIcon class="w-5 h-5" />
            画质
          </button>
        </div>
      </div>

      <!-- Quality Menu -->
      <Transition name="slide">
        <div 
          v-if="showQualityMenu" 
          class="absolute bottom-20 right-4 card bg-base-100 shadow-xl"
        >
          <div class="card-body p-2">
            <button
              v-for="level in qualityLevels"
              :key="level.id"
              @click="changeQuality(level)"
              class="btn btn-ghost btn-sm justify-start focusable"
              :class="{ 'btn-active': currentQualityId === level.id }"
            >
              {{ level.name }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Stream Info -->
    <div class="p-4 bg-base-100">
      <div class="max-w-4xl mx-auto">
        <div class="stats shadow w-full">
          <div class="stat">
            <div class="stat-title">状态</div>
            <div class="stat-value text-success">直播中</div>
          </div>
          <div class="stat">
            <div class="stat-title">画质</div>
            <div class="stat-value text-primary">{{ currentQuality }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">延迟</div>
            <div class="stat-value">{{ latency }}ms</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGamesStore } from '../stores/games'
import Hls from 'hls.js'
import {
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const gamesStore = useGamesStore()

const videoRef = ref(null)
const loading = ref(true)
const error = ref(null)
const isPlaying = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)
const showQualityMenu = ref(false)
const currentQualityId = ref(-1)
const qualityLevels = ref([])
const latency = ref(0)

let hls = null
let controlsTimeout = null

const gameTitle = computed(() => {
  const { team1, team2 } = route.query
  return team1 && team2 ? `${team1} VS ${team2}` : '直播'
})

const streamName = computed(() => {
  return route.query.name || '直播源'
})

const currentQuality = computed(() => {
  const level = qualityLevels.value.find(l => l.id === currentQualityId.value)
  return level?.name || '自动'
})

function goBack() {
  router.back()
}

function togglePlay() {
  if (videoRef.value) {
    if (videoRef.value.paused) {
      videoRef.value.play()
    } else {
      videoRef.value.pause()
    }
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    videoRef.value.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function changeQuality(level) {
  if (hls) {
    hls.currentLevel = level.id
    currentQualityId.value = level.id
  }
  showQualityMenu.value = false
}

function showControlsTemporarily() {
  showControls.value = true
  clearTimeout(controlsTimeout)
  controlsTimeout = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

async function initializePlayer() {
  try {
    loading.value = true
    error.value = null

    const { url } = route.query
    if (!url) {
      throw new Error('缺少播放地址')
    }

    // 获取流地址
    console.log('正在获取流地址，URL:', url)
    const streamData = await gamesStore.getStreamUrl(url)
    console.log('获取到的流数据:', streamData)
    
    if (!streamData.streamUrl) {
      throw new Error('无法获取流地址')
    }
    
    // 验证流地址
    if (!streamData.streamUrl.includes('.m3u8') && !streamData.streamUrl.includes('http')) {
      console.error('无效的流地址:', streamData.streamUrl)
      throw new Error('获取到的流地址无效')
    }

    // 使用代理地址
    const proxyUrl = `/proxy/m3u8?url=${encodeURIComponent(streamData.streamUrl)}`
    console.log('代理URL:', proxyUrl)
    
    if (Hls.isSupported()) {
      hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: Infinity,
        liveDurationInfinity: true,
        preferManagedMediaSource: true,
      })

      hls.loadSource(proxyUrl)
      hls.attachMedia(videoRef.value)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        loading.value = false
        videoRef.value.play()
        
        // 获取画质选项
        qualityLevels.value = hls.levels.map((level, index) => ({
          id: index,
          name: `${level.height}p${level.bitrate ? ` (${Math.round(level.bitrate / 1000)}kbps)` : ''}`
        }))
        
        // 添加自动选项
        qualityLevels.value.unshift({
          id: -1,
          name: '自动'
        })
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data)
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              error.value = '播放器发生错误: ' + data.details
              hls.destroy()
              break
          }
        }
      })

      // 监听延迟
      hls.on(Hls.Events.FRAG_LOADING, (event, data) => {
        const loadTime = data.stats.loading.end - data.stats.loading.start
        latency.value = Math.round(loadTime)
      })

    } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari原生支持
      videoRef.value.src = proxyUrl
      videoRef.value.addEventListener('loadedmetadata', () => {
        loading.value = false
        videoRef.value.play()
      })
    } else {
      throw new Error('浏览器不支持HLS播放')
    }

  } catch (err) {
    console.error('Player initialization error:', err)
    error.value = err.message
    loading.value = false
  }
}

function retry() {
  if (hls) {
    hls.destroy()
    hls = null
  }
  initializePlayer()
}

onMounted(() => {
  initializePlayer()

  // 视频事件监听
  if (videoRef.value) {
    videoRef.value.addEventListener('play', () => {
      isPlaying.value = true
    })
    
    videoRef.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
  }

  // 鼠标移动显示控制栏
  document.addEventListener('mousemove', showControlsTemporarily)
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      togglePlay()
    } else if (e.key === 'f') {
      toggleFullscreen()
    }
  })
})

onUnmounted(() => {
  if (hls) {
    hls.destroy()
  }
  clearTimeout(controlsTimeout)
  document.removeEventListener('mousemove', showControlsTemporarily)
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
</style>