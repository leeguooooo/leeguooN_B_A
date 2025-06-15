<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <!-- Header -->
    <header class="fixed top-0 w-full z-50 bg-[#141414]/95 backdrop-blur-md border-b border-white/10">
      <div class="container mx-auto px-3 sm:px-4">
        <div class="flex items-center justify-between h-14 sm:h-16">
          <!-- Logo -->
          <div class="flex items-center space-x-3 sm:space-x-8">
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-base sm:text-lg">L</span>
              </div>
              <span class="text-lg sm:text-xl font-bold text-white">体育直播</span>
              <span class="px-1.5 py-0.5 sm:px-2 bg-red-500 text-white text-[10px] sm:text-xs rounded-full animate-pulse">LIVE</span>
            </div>
            
            <!-- Nav -->
            <!-- Nav removed for now -->
          </div>
          
          
          <!-- Right Actions (Desktop) -->
          <div class="hidden md:flex items-center space-x-4">
            <button 
              @click="shareApp"
              class="p-2 text-white/60 hover:text-white transition"
              title="分享"
            >
              <ShareIcon class="w-5 h-5" />
            </button>
            <button 
              @click="refreshGames"
              class="p-2 text-white/60 hover:text-white transition"
              :class="{ 'animate-spin': gamesStore.loading }"
              title="刷新"
            >
              <ArrowPathIcon class="w-5 h-5" />
            </button>
            <a 
              href="/settings.html"
              class="p-2 text-white/60 hover:text-white transition"
              title="设置"
            >
              <CogIcon class="w-5 h-5" />
            </a>
          </div>
          
          <!-- Mobile Actions -->
          <div class="flex md:hidden items-center space-x-2">
            <button 
              @click="shareApp"
              class="p-1.5 text-white/60 hover:text-white transition"
            >
              <ShareIcon class="w-4 h-4" />
            </button>
            <button 
              @click="refreshGames"
              class="p-1.5 text-white/60 hover:text-white transition"
              :class="{ 'animate-spin': gamesStore.loading }"
            >
              <ArrowPathIcon class="w-4 h-4" />
            </button>
            <a 
              href="/settings.html"
              class="p-1.5 text-white/60 hover:text-white transition"
            >
              <CogIcon class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      
      <!-- Mobile Menu removed for now -->
    </header>

    <!-- Main Content -->
    <main class="pt-16">
      <!-- Hero Section -->
      <section class="relative h-[280px] sm:h-[380px] md:h-[450px] overflow-hidden">
        <!-- Enhanced Background -->
        <div class="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&h=450&fit=crop&q=80" 
            alt="Hero"
            class="w-full h-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-red-900/20 to-orange-900/20"></div>
        </div>
        
        <div class="relative z-20 container mx-auto px-3 sm:px-4 h-full flex items-center">
          <div class="max-w-3xl">
            <!-- Title with Gradient -->
            <h1 class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
              <span class="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">精彩赛事</span>
              <span class="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">·即刻观看</span>
            </h1>
            
            <!-- Enhanced Subtitle -->
            <p class="text-base sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 font-light leading-relaxed">
              覆盖全球顶级体育赛事，超高清直播体验
            </p>
            
            <!-- Live Indicator -->
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/30">
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-sm sm:text-base text-red-400 font-medium">{{ filteredLiveGames.length }} 场正在直播</span>
              </div>
              
              <!-- Quick Stats -->
              <div class="hidden sm:flex items-center gap-4 text-sm text-white/70">
                <div class="flex items-center gap-1">
                  <TvIcon class="w-4 h-4" />
                  <span>{{ totalGames }} 场比赛</span>
                </div>
                <div class="flex items-center gap-1">
                  <TrophyIcon class="w-4 h-4" />
                  <span>{{ uniqueLeagues.size }} 个联赛</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Filter Tabs -->
      <section class="bg-[#1a1a1a] border-b border-white/10 sticky top-14 sm:top-16 z-40">
        <div class="container mx-auto px-3 sm:px-4">
          <!-- Data Update Time -->
          <div v-if="dataUpdateTime" class="flex items-center justify-center py-3">
            <div class="flex items-center gap-4 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <div class="flex items-center text-xs sm:text-sm text-white/70">
                <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                <span>更新于 {{ formatUpdateTime(dataUpdateTime) }}</span>
                <span v-if="isDataStale" class="ml-2 text-yellow-400 font-medium">(数据已过期)</span>
              </div>
              <button 
                @click="manualUpdateData"
                class="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                :disabled="updatingData"
              >
                <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': updatingData }" />
                {{ updatingData ? '更新中' : '刷新数据' }}
              </button>
            </div>
          </div>
          <div class="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-3 sm:py-4">
            <button
              v-for="league in allLeagues"
              :key="league.id"
              @click="selectedLeague = league.id"
              class="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border"
              :class="selectedLeague === league.id 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' 
                : 'text-white/60 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/20'"
            >
              {{ league.name }}
              <span v-if="getLeagueCount(league.id)" class="ml-1 sm:ml-2 text-[10px] sm:text-xs opacity-80">
                {{ getLeagueCount(league.id) }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- Games Grid -->
      <section class="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <!-- Live Now Section -->
        <div v-if="filteredLiveGames.length > 0" class="mb-8 sm:mb-10 md:mb-12">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-white flex items-center">
              <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse mr-2 sm:mr-3"></span>
              正在直播
            </h2>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <GameCardPro
              v-for="game in filteredLiveGames"
              :key="game.id"
              :game="game"
              :is-live="true"
              @click="selectGame(game)"
            />
          </div>
        </div>

        <!-- Upcoming Games -->
        <div v-if="filteredUpcomingGames.length > 0">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-white">即将开始</h2>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <GameCardPro
              v-for="game in filteredUpcomingGames"
              :key="game.id"
              :game="game"
              :is-live="false"
              @click="selectGame(game)"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredGames.length === 0 && !gamesStore.loading" 
          class="flex flex-col items-center justify-center py-20">
          <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <TvIcon class="w-12 h-12 text-white/20" />
          </div>
          <h3 class="text-xl font-medium text-white/60 mb-2">暂无赛事</h3>
          <p class="text-white/40">请选择其他分类或稍后再来</p>
        </div>

        <!-- Enhanced Loading -->
        <div v-if="gamesStore.loading" class="flex flex-col items-center justify-center py-20">
          <div class="relative">
            <!-- Spinning ring -->
            <div class="w-16 h-16 border-4 border-white/10 rounded-full"></div>
            <div class="absolute inset-0 w-16 h-16 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
            
            <!-- Center icon -->
            <div class="absolute inset-0 flex items-center justify-center">
              <TvIcon class="w-8 h-8 text-red-500" />
            </div>
          </div>
          <p class="mt-4 text-white/60 text-sm animate-pulse">加载赛事数据中...</p>
        </div>
      </section>
    </main>
    
    <!-- Footer -->
    <footer class="bg-gradient-to-t from-black to-[#0a0a0a] border-t border-white/10 mt-16">
      <div class="container mx-auto px-4 py-8">
        <div class="text-center">
          <p class="text-white/40 text-sm">
            © 2024 体育赛事直播中心 · 
            <a href="#" class="hover:text-white/60 transition-colors">使用条款</a> · 
            <a href="#" class="hover:text-white/60 transition-colors">隐私政策</a>
          </p>
          <p class="text-white/30 text-xs mt-2">
            本站仅提供赛事信息聚合服务，不提供直播内容
          </p>
        </div>
      </div>
    </footer>

    <!-- Quick Access Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLinkModal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="showLinkModal = false"
          ></div>
          
          <!-- Modal Content -->
          <div class="relative bg-[#1a1a1a] w-full md:max-w-4xl md:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden">
            <!-- Header -->
            <div class="sticky top-0 bg-[#1a1a1a] border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg sm:text-xl font-bold text-white">选择观看线路</h3>
                  <p class="text-xs sm:text-sm text-white/60 mt-1">{{ currentGame?.team1 }} VS {{ currentGame?.team2 }}</p>
                </div>
                <button 
                  @click="showLinkModal = false"
                  class="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <XMarkIcon class="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                </button>
              </div>
            </div>
            
            <!-- Links Grid - No Scroll -->
            <div class="p-4 sm:p-6">
              <div v-if="linkLoading" class="flex justify-center py-8 sm:py-12">
                <div class="flex space-x-2">
                  <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-bounce"></div>
                  <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                  <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
              </div>
              
              <div v-else class="grid grid-cols-1 gap-3 sm:gap-4">
                <button
                  v-for="(link, index) in currentLinks"
                  :key="index"
                  @click="handleLinkSelect(link)"
                  class="group relative bg-[#242424] hover:bg-[#2a2a2a] rounded-xl p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-xl"
                  :class="getLinkClass(link.name)"
                >
                  <!-- Quality Badge -->
                  <div v-if="isHighQuality(link.name)" 
                    class="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    推荐
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 sm:space-x-4">
                      <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                        :class="getIconBg(link.name)">
                        {{ getIcon(link.name) }}
                      </div>
                      <div class="text-left min-w-0">
                        <h4 class="text-white font-medium text-sm sm:text-base">{{ link.name }}</h4>
                        <p class="text-white/40 text-xs sm:text-sm">{{ getLinkDescription(link.name) }}</p>
                      </div>
                    </div>
                    <ChevronRightIcon class="w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-white/60 transition flex-shrink-0" />
                  </div>
                  
                  <!-- New Tab Indicator -->
                  <div v-if="needsNewTab(link.name)" class="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <ArrowTopRightOnSquareIcon class="w-3 h-3 sm:w-4 sm:h-4 text-white/40" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Toast
      v-model:show="showToast"
      :message="toastMessage"
      :type="toastType"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../stores/games'
import GameCardPro from '../components/GameCardPro.vue'
import Toast from '../components/Toast.vue'
import {
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  TvIcon,
  ArrowTopRightOnSquareIcon,
  ShareIcon,
  ClockIcon,
  CogIcon,
  TrophyIcon,
  PlayIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const gamesStore = useGamesStore()

const selectedLeague = ref('all')
const showLinkModal = ref(false)
const currentLinks = ref([])
const linkLoading = ref(false)
const currentGame = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')
const dataUpdateTime = ref(null)
const isDataStale = ref(false)
const updatingData = ref(false)

const allLeagues = computed(() => {
  return [
    { id: 'all', name: '全部' },
    ...gamesStore.leagues
  ]
})

const filteredGames = computed(() => {
  if (selectedLeague.value === 'all') {
    return gamesStore.games
  }
  return gamesStore.games.filter(game => game.league === selectedLeague.value)
})

const filteredLiveGames = computed(() => {
  return filteredGames.value.filter(game => isGameLive(game))
})

const filteredUpcomingGames = computed(() => {
  return filteredGames.value.filter(game => !isGameLive(game))
})

const gamesWithLinks = computed(() => {
  return gamesStore.games.filter(game => game.liveLinks && game.liveLinks.length > 0).length
})

const totalGames = computed(() => gamesStore.games.length)

const uniqueLeagues = computed(() => {
  return new Set(gamesStore.games.map(game => game.league))
})

const totalLiveGames = computed(() => {
  // 只计算正在进行的比赛的直播源数量
  return gamesStore.games.reduce((total, game) => {
    if (isGameLive(game)) {
      return total + (game.liveLinks ? game.liveLinks.length : 0)
    }
    return total
  }, 0)
})

function getLeagueCount(leagueId) {
  if (leagueId === 'all') return gamesStore.games.length
  return gamesStore.games.filter(game => game.league === leagueId).length
}

function isGameLive(game) {
  const now = new Date()
  const gameDate = parseGameTime(game.gameTime)
  const timeDiff = now - gameDate
  
  // 只显示已经开始且在2小时内的比赛为"正在直播"
  // 足球比赛通常90分钟，加上中场休息和伤停补时，约2小时
  return timeDiff >= 0 && timeDiff <= 2 * 60 * 60 * 1000
}

function parseGameTime(gameTime) {
  const [date, time] = gameTime.split(' ')
  const [month, day] = date.split('-')
  const [hour, minute] = time.split(':')
  const year = new Date().getFullYear()
  return new Date(year, month - 1, day, hour, minute)
}

async function refreshGames() {
  await gamesStore.fetchGames()
  // 获取数据更新时间
  dataUpdateTime.value = gamesStore.lastUpdateTime
  checkDataFreshness()
}

function checkDataFreshness() {
  if (!dataUpdateTime.value) {
    isDataStale.value = false
    return
  }
  
  const now = Date.now()
  const updateTime = typeof dataUpdateTime.value === 'string' 
    ? parseInt(dataUpdateTime.value) 
    : dataUpdateTime.value
  
  // 如果数据超过10分钟，认为可能过期
  const timeDiff = now - updateTime
  isDataStale.value = timeDiff > 10 * 60 * 1000
}

function formatUpdateTime(timestamp) {
  if (!timestamp) return '未知'
  
  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const date = new Date(time)
  const now = new Date()
  
  // 如果是今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 如果是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 其他日期
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

async function selectGame(game) {
  currentGame.value = game
  
  if (game.liveLinks && game.liveLinks.length > 0) {
    const validLinks = game.liveLinks.filter(link => 
      link.url && link.url !== 'javascript:void(0)'
    )
    
    if (validLinks.length > 0) {
      const defaultLink = validLinks[0]
      
      linkLoading.value = true
      showLinkModal.value = true
      
      try {
        const links = await gamesStore.fetchLiveLinks(defaultLink.url)
        
        // 排序
        const sortedLinks = links.sort((a, b) => {
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
    }
  }
}

function getLinkClass(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) {
    return 'ring-2 ring-yellow-500/50'
  }
  return ''
}

function getIconBg(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) {
    return 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
  }
  if (name.includes('高清')) {
    return 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
  }
  if (name.includes('主播')) {
    return 'bg-gradient-to-br from-green-500/20 to-teal-500/20'
  }
  return 'bg-white/10'
}

function getIcon(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) return '4K'
  if (name.includes('高清') || name.includes('超清')) return 'HD'
  if (name.includes('主播')) return '🎤'
  return '📺'
}

function getLinkDescription(name) {
  if (name.includes('中文蓝光')) return '4K超高清 · 中文解说'
  if (name.includes('中文高清')) return '1080P · 中文解说'
  if (name.includes('高清')) return '高清画质 · 流畅稳定'
  if (name.includes('主播')) return '专业解说 · 互动弹幕'
  return '标准画质'
}

function isHighQuality(name) {
  return name.includes('中文蓝光') || name.includes('中文高清')
}

function needsNewTab(name) {
  return name.includes('纬来') || name.includes('中文蓝光') || name.includes('中文高清') || name.includes('kbs')
}

async function handleLinkSelect(link) {
  showLinkModal.value = false
  
  const newTabSources = ['纬来', '中文蓝光', '中文高清', 'kbs.html'];
  const needsNewTab = newTabSources.some(source => 
    link.name.includes(source) || link.url.includes(source)
  );
  
  if (needsNewTab) {
    window.open(link.url, '_blank')
    showToast.value = true
    toastMessage.value = '已在新标签页中打开'
    toastType.value = 'info'
    return
  }
  
  const iframeOnlySources = ['pap.html', 'pao.php'];
  const needsIframe = iframeOnlySources.some(source => link.url.includes(source));
  
  if (needsIframe) {
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

function shareApp() {
  const shareData = {
    title: '体育直播 - NBA/CBA/足球高清直播',
    text: '免费观看体育赛事高清直播，支持手机、电脑观看',
    url: window.location.href
  }
  
  if (navigator.share) {
    navigator.share(shareData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          copyToClipboard()
        }
      })
  } else {
    copyToClipboard()
  }
}

function copyToClipboard() {
  const text = `体育直播 - 高清免费观看\n${window.location.href}`
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast.value = true
        toastMessage.value = '链接已复制，可以分享给好友了'
        toastType.value = 'success'
      })
      .catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  
  try {
    document.execCommand('copy')
    showToast.value = true
    toastMessage.value = '链接已复制，可以分享给好友了'
    toastType.value = 'success'
  } catch (err) {
    showToast.value = true
    toastMessage.value = '复制失败，请手动复制链接'
    toastType.value = 'error'
  }
  
  document.body.removeChild(textarea)
}

async function manualUpdateData() {
  if (updatingData.value) return
  
  updatingData.value = true
  showToast.value = true
  toastMessage.value = '正在更新数据...'
  toastType.value = 'info'
  
  try {
    // 优先使用配置的 API_KEY 或默认的
    const apiKey = localStorage.getItem('apiKey') || 'kuaikuaishiyongshuangjiegunheiheihahei'
    
    // 获取当前的 Vercel URL
    const baseUrl = window.location.origin
    
    console.log('触发更新:', `${baseUrl}/api/webhook/update`, 'API Key:', apiKey.substring(0, 10) + '...')
    
    // 触发后端更新
    const response = await fetch(`${baseUrl}/api/webhook/update`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Update result:', result)
      
      showToast.value = true
      toastMessage.value = `正在处理 ${result.gamesCount || 0} 场比赛数据...`
      toastType.value = 'info'
      
      // 等待更长时间确保 KV 存储更新完成
      showToast.value = true
      toastMessage.value = '等待数据同步...'
      toastType.value = 'info'
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // 获取更新前的数据数量
      const oldCount = gamesStore.games.length
      
      // 刷新页面数据
      await refreshGamesWithTimestamp()
      
      // 获取更新后的数据数量
      const newCount = gamesStore.games.length
      
      showToast.value = true
      if (oldCount !== newCount) {
        toastMessage.value = `数据更新成功！(${oldCount} → ${newCount} 场比赛)`
      } else {
        toastMessage.value = `数据已是最新！(共 ${newCount} 场比赛)`
      }
      toastType.value = 'success'
    } else {
      const error = await response.text()
      throw new Error(`更新失败: ${response.status} - ${error}`)
    }
  } catch (error) {
    console.error('更新失败:', error)
    showToast.value = true
    toastMessage.value = error.message || '更新失败，请稍后重试'
    toastType.value = 'error'
  } finally {
    updatingData.value = false
  }
}

async function refreshGamesWithTimestamp() {
  // 使用 KV API 获取最新数据
  await gamesStore.fetchGames()
  dataUpdateTime.value = gamesStore.lastUpdateTime
  checkDataFreshness()
}

onMounted(() => {
  refreshGames()
  // 每分钟检查一次数据新鲜度
  setInterval(checkDataFreshness, 60000)
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child {
  transform: translateY(100%);
}

.modal-leave-to > div:last-child {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-enter-from > div:last-child,
  .modal-leave-to > div:last-child {
    transform: scale(0.95) translateY(0);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>