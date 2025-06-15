<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
    <!-- Header -->
    <header class="navbar glass sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <div class="flex-1">
          <h1 class="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            体育直播
          </h1>
        </div>
        <div class="flex-none gap-2">
          <button 
            @click="refreshGames" 
            class="btn btn-ghost btn-circle focusable"
            :class="{ 'loading': gamesStore.loading }"
          >
            <RefreshIcon class="w-6 h-6" />
          </button>
          <button 
            @click="toggleTheme" 
            class="btn btn-ghost btn-circle focusable"
          >
            <SunIcon v-if="isDark" class="w-6 h-6" />
            <MoonIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>

    <!-- League Filter -->
    <div class="container mx-auto px-4 py-4">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">选择赛事</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="league in gamesStore.leagues"
              :key="league.id"
              @click="gamesStore.toggleLeague(league.id)"
              class="btn focusable"
              :class="{
                'btn-primary': gamesStore.selectedLeagues.includes(league.id),
                'btn-ghost': !gamesStore.selectedLeagues.includes(league.id)
              }"
            >
              <span class="mr-1">{{ league.icon }}</span>
              {{ league.name }}
            </button>
            <div class="divider divider-horizontal"></div>
            <button 
              @click="gamesStore.selectAllLeagues" 
              class="btn btn-outline btn-sm focusable"
            >
              全选
            </button>
            <button 
              @click="gamesStore.clearLeagues" 
              class="btn btn-outline btn-sm focusable"
            >
              清空
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Games (如果有正在进行的比赛) -->
    <div v-if="gamesStore.liveGames.length > 0" class="container mx-auto px-4 py-4">
      <div class="alert alert-success shadow-lg mb-4">
        <div>
          <PlayIcon class="w-6 h-6 animate-pulse" />
          <span>{{ gamesStore.liveGames.length }} 场比赛正在直播</span>
        </div>
      </div>
    </div>

    <!-- Games List -->
    <div class="container mx-auto px-4 py-4">
      <div v-if="gamesStore.loading" class="flex justify-center py-20">
        <div class="loading loading-spinner loading-lg"></div>
      </div>
      
      <div v-else-if="gamesStore.error" class="alert alert-error">
        <div>
          <ExclamationTriangleIcon class="w-6 h-6" />
          <span>{{ gamesStore.error }}</span>
        </div>
      </div>
      
      <div v-else-if="Object.keys(gamesStore.groupedGames).length === 0" class="text-center py-20">
        <p class="text-xl text-base-content/60">暂无比赛数据</p>
      </div>
      
      <div v-else class="space-y-8">
        <div v-for="(games, date) in gamesStore.groupedGames" :key="date">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            <CalendarIcon class="w-6 h-6" />
            {{ formatDate(date) }}
          </h3>
          
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <GameCard
              v-for="game in games"
              :key="game.id"
              :game="game"
              @select="selectGame"
              class="focusable"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Link Selection Modal -->
    <LinkModal
      v-model:show="showLinkModal"
      :links="currentLinks"
      :loading="linkLoading"
      @select="handleLinkSelect"
    />
    
    <!-- Toast Notification -->
    <Toast
      v-model:show="showToast"
      :message="toastMessage"
      :type="toastType"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../stores/games'
import { useNavigationStore } from '../stores/navigation'
import GameCard from '../components/GameCard.vue'
import LinkModal from '../components/LinkModal.vue'
import Toast from '../components/Toast.vue'
import {
  ArrowPathIcon as RefreshIcon,
  SunIcon,
  MoonIcon,
  PlayCircleIcon as PlayIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const gamesStore = useGamesStore()
const navigationStore = useNavigationStore()

const showLinkModal = ref(false)
const currentLinks = ref([])
const linkLoading = ref(false)
const currentGame = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

const isDark = computed(() => {
  return document.documentElement.getAttribute('data-theme') === 'dark'
})

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

async function refreshGames() {
  await gamesStore.fetchGames()
  navigationStore.updateFocusableElements()
}

async function selectGame(game) {
  console.log('选择比赛:', game)
  currentGame.value = game
  
  if (game.liveLinks && game.liveLinks.length > 0) {
    // 过滤掉无效链接
    const validLinks = game.liveLinks.filter(link => 
      link.url && link.url !== 'javascript:void(0)'
    )
    
    console.log('有效链接:', validLinks)
    
    if (validLinks.length > 0) {
      // 尝试找到默认的直播源
      const defaultLink = validLinks.find(link => 
        link.name.includes('高清') || link.name.includes('主播')
      ) || validLinks[0]
      
      // 获取具体的直播链接
      linkLoading.value = true
      showLinkModal.value = true
      
      try {
        const links = await gamesStore.fetchLiveLinks(defaultLink.url)
        
        // 对链接进行排序，中文蓝光优先级最高
        const sortedLinks = links.sort((a, b) => {
          // 定义优先级
          const getPriority = (name) => {
            if (name.includes('中文蓝光')) return 10;
            if (name.includes('中文高清')) return 9;
            if (name.includes('高清')) return 8;
            if (name.includes('超清')) return 7;
            if (name.includes('主播')) return 6;
            return 1;
          };
          
          return getPriority(b.name) - getPriority(a.name);
        });
        
        currentLinks.value = sortedLinks
      } catch (error) {
        console.error('Failed to fetch live links:', error)
        currentLinks.value = []
      } finally {
        linkLoading.value = false
      }
    } else {
      // 如果没有有效链接，显示提示
      console.log('没有有效的直播链接')
      showToastMessage('暂无可用的直播源', 'warning')
    }
  } else {
    console.log('没有直播链接')
    showToastMessage('该比赛暂无直播源', 'warning')
  }
}

async function handleLinkSelect(link) {
  showLinkModal.value = false
  
  // 检查是否需要在新标签页打开
  const newTabSources = ['纬来', '中文蓝光', '中文高清', 'kbs.html'];
  const needsNewTab = newTabSources.some(source => 
    link.name.includes(source) || link.url.includes(source)
  );
  
  if (needsNewTab) {
    window.open(link.url, '_blank')
    let sourceName = '直播源';
    if (link.name.includes('纬来')) sourceName = '纬来体育';
    else if (link.name.includes('中文蓝光')) sourceName = '中文蓝光';
    else if (link.name.includes('中文高清')) sourceName = '中文高清';
    showToastMessage(`${sourceName}已在新标签页中打开`, 'info')
    return
  }
  
  // 检查是否是已知的 iframe 类型（无法获取 m3u8）
  const iframeOnlySources = ['pap.html', 'pao.php'];
  const needsIframe = iframeOnlySources.some(source => link.url.includes(source));
  
  if (needsIframe) {
    // 直接跳转到 iframe 播放器
    router.push({
      path: '/iframe-player',
      query: {
        url: link.url,
        name: link.name,
        team1: currentGame.value.team1,
        team2: currentGame.value.team2
      }
    })
  } else {
    // 尝试正常播放器
    router.push({
      path: '/player',
      query: {
        url: link.url,
        name: link.name,
        team1: currentGame.value.team1,
        team2: currentGame.value.team2
      }
    })
  }
}

function showToastMessage(message, type = 'info') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

function formatDate(dateStr) {
  const today = new Date()
  const [month, day] = dateStr.split('-')
  const gameDate = new Date(today.getFullYear(), month - 1, day)
  
  const diffDays = Math.floor((gameDate - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  
  return `${month}月${day}日`
}

onMounted(() => {
  // 加载主题设置
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  // 加载比赛数据
  refreshGames()
})
</script>