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
            <nav class="hidden md:flex items-center space-x-6">
              <a href="#" class="text-white hover:text-red-500 transition">全部赛事</a>
              <a href="#" class="text-white/60 hover:text-white transition">NBA</a>
              <a href="#" class="text-white/60 hover:text-white transition">足球</a>
              <a href="#" class="text-white/60 hover:text-white transition">电竞</a>
            </nav>
          </div>
          
          <!-- Mobile Menu Button -->
          <button 
            @click="showMobileMenu = !showMobileMenu"
            class="md:hidden p-2 text-white/60 hover:text-white transition"
          >
            <Bars3Icon v-if="!showMobileMenu" class="w-5 h-5" />
            <XMarkIcon v-else class="w-5 h-5" />
          </button>
          
          <!-- Right Actions (Desktop) -->
          <div class="hidden md:flex items-center space-x-4">
            <button 
              @click="shareApp"
              class="p-2 text-white/60 hover:text-white transition"
            >
              <ShareIcon class="w-5 h-5" />
            </button>
            <button 
              @click="refreshGames"
              class="p-2 text-white/60 hover:text-white transition"
              :class="{ 'animate-spin': gamesStore.loading }"
            >
              <ArrowPathIcon class="w-5 h-5" />
            </button>
            <button class="p-2 text-white/60 hover:text-white transition">
              <MagnifyingGlassIcon class="w-5 h-5" />
            </button>
            <button class="p-2 text-white/60 hover:text-white transition">
              <BellIcon class="w-5 h-5" />
            </button>
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
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
          </div>
        </div>
      </div>
      
      <!-- Mobile Menu -->
      <Transition name="slide-down">
        <div v-if="showMobileMenu" class="md:hidden bg-[#141414] border-t border-white/10">
          <nav class="container mx-auto px-3 py-4 space-y-3">
            <a href="#" class="block text-white hover:text-red-500 transition">全部赛事</a>
            <a href="#" class="block text-white/60 hover:text-white transition">NBA</a>
            <a href="#" class="block text-white/60 hover:text-white transition">足球</a>
            <a href="#" class="block text-white/60 hover:text-white transition">电竞</a>
          </nav>
        </div>
      </Transition>
    </header>

    <!-- Main Content -->
    <main class="pt-16">
      <!-- Hero Section -->
      <section class="relative h-[250px] sm:h-[350px] md:h-[400px] overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&h=400&fit=crop" 
          alt="Hero"
          class="absolute inset-0 w-full h-full object-cover"
        >
        <div class="relative z-20 container mx-auto px-3 sm:px-4 h-full flex items-center">
          <div class="max-w-2xl">
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              精彩赛事，<span class="text-red-500">即刻观看</span>
            </h1>
            <p class="text-base sm:text-lg md:text-xl text-white/80 mb-4 sm:mb-6 md:mb-8">
              覆盖全球顶级体育赛事，超高清直播体验
            </p>
            <div class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div class="flex items-center space-x-2">
                <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-sm sm:text-base text-white font-medium">{{ gamesStore.liveGames.length }} 场直播中</span>
              </div>
              <div class="flex items-center space-x-2">
                <UsersIcon class="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                <span class="text-sm sm:text-base text-white/80">2.3M 在线观看</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Filter Tabs -->
      <section class="bg-[#1a1a1a] border-b border-white/10 sticky top-14 sm:top-16 z-40">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-3 sm:py-4">
            <button
              v-for="league in allLeagues"
              :key="league.id"
              @click="selectedLeague = league.id"
              class="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              :class="selectedLeague === league.id 
                ? 'bg-red-500 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/10'"
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
            <a href="#" class="text-red-500 hover:text-red-400 transition flex items-center text-sm sm:text-base">
              查看全部
              <ChevronRightIcon class="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </a>
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

        <!-- Loading -->
        <div v-if="gamesStore.loading" class="flex justify-center py-20">
          <div class="flex space-x-2">
            <div class="w-3 h-3 bg-red-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-3 h-3 bg-red-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-3 h-3 bg-red-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </section>
    </main>

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
  MagnifyingGlassIcon,
  BellIcon,
  ChevronRightIcon,
  XMarkIcon,
  UsersIcon,
  TvIcon,
  ArrowTopRightOnSquareIcon,
  ShareIcon,
  Bars3Icon
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
const showMobileMenu = ref(false)

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

function getLeagueCount(leagueId) {
  if (leagueId === 'all') return gamesStore.games.length
  return gamesStore.games.filter(game => game.league === leagueId).length
}

function isGameLive(game) {
  const now = new Date()
  const gameDate = parseGameTime(game.gameTime)
  const timeDiff = now - gameDate
  return timeDiff >= 0 && timeDiff <= 3 * 60 * 60 * 1000
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

onMounted(() => {
  refreshGames()
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