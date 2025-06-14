<template>
  <div class="min-h-screen bg-base-100">
    <!-- Hero Header -->
    <div class="relative overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div class="relative">
        <div class="navbar glass backdrop-blur-md border-b border-base-200/50">
          <div class="container mx-auto px-4">
            <div class="flex-1">
              <h1 class="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                体育直播
              </h1>
              <span class="ml-2 badge badge-primary badge-sm">LIVE</span>
            </div>
            <div class="flex-none gap-2">
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-circle avatar online">
                  <div class="w-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                    <div class="rounded-full bg-base-100 p-2">
                      <UserIcon class="w-5 h-5" />
                    </div>
                  </div>
                </label>
              </div>
              <button 
                @click="refreshGames" 
                class="btn btn-ghost btn-circle hover:rotate-180 transition-transform duration-500"
                :class="{ 'animate-spin': gamesStore.loading }"
              >
                <ArrowPathIcon class="w-6 h-6" />
              </button>
              <button 
                @click="toggleTheme" 
                class="btn btn-ghost btn-circle"
              >
                <SunIcon v-if="isDark" class="w-6 h-6" />
                <MoonIcon v-else class="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="container mx-auto px-4 py-6">
          <div class="stats stats-horizontal shadow-lg w-full bg-base-100/80 backdrop-blur">
            <div class="stat">
              <div class="stat-figure text-primary">
                <FireIcon class="w-8 h-8" />
              </div>
              <div class="stat-title">今日赛事</div>
              <div class="stat-value text-primary">{{ todayGamesCount }}</div>
              <div class="stat-desc">{{ currentTime }}</div>
            </div>
            
            <div class="stat">
              <div class="stat-figure text-secondary">
                <PlayCircleIcon class="w-8 h-8 animate-pulse" />
              </div>
              <div class="stat-title">正在直播</div>
              <div class="stat-value text-secondary">{{ gamesStore.liveGames.length }}</div>
              <div class="stat-desc">实时更新</div>
            </div>
            
            <div class="stat">
              <div class="stat-figure text-accent">
                <TrophyIcon class="w-8 h-8" />
              </div>
              <div class="stat-title">赛事类型</div>
              <div class="stat-value text-accent">{{ gamesStore.selectedLeagues.length }}</div>
              <div class="stat-desc">已选择</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- League Filter -->
    <div class="container mx-auto px-4 py-6">
      <div class="card bg-base-200/50 backdrop-blur shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title text-2xl">
              <Squares2X2Icon class="w-6 h-6" />
              选择赛事
            </h2>
            <div class="flex gap-2">
              <button 
                @click="gamesStore.selectAllLeagues" 
                class="btn btn-sm btn-outline"
              >
                全选
              </button>
              <button 
                @click="gamesStore.clearLeagues" 
                class="btn btn-sm btn-outline"
              >
                清空
              </button>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3">
            <button
              v-for="league in gamesStore.leagues"
              :key="league.id"
              @click="gamesStore.toggleLeague(league.id)"
              class="btn gap-2 hover:scale-105 transition-all"
              :class="{
                'btn-primary shadow-lg': gamesStore.selectedLeagues.includes(league.id),
                'btn-ghost': !gamesStore.selectedLeagues.includes(league.id)
              }"
            >
              <span class="text-xl">{{ league.icon }}</span>
              <span class="font-bold">{{ league.name }}</span>
              <span v-if="getLeagueCount(league.id)" class="badge badge-sm">
                {{ getLeagueCount(league.id) }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Alert -->
    <div v-if="gamesStore.liveGames.length > 0" class="container mx-auto px-4">
      <div class="alert alert-success shadow-lg animate-pulse">
        <PlayCircleIcon class="w-6 h-6" />
        <div>
          <h3 class="font-bold">{{ gamesStore.liveGames.length }} 场比赛正在直播！</h3>
          <div class="text-xs">点击卡片即可观看</div>
        </div>
        <button class="btn btn-sm">立即观看</button>
      </div>
    </div>

    <!-- Games Grid -->
    <div class="container mx-auto px-4 py-6">
      <div v-if="gamesStore.loading" class="flex justify-center py-20">
        <div class="loading loading-ball loading-lg"></div>
      </div>
      
      <div v-else-if="gamesStore.error" class="alert alert-error">
        <ExclamationTriangleIcon class="w-6 h-6" />
        <span>{{ gamesStore.error }}</span>
      </div>
      
      <div v-else-if="Object.keys(gamesStore.groupedGames).length === 0" 
        class="hero min-h-[400px] bg-base-200 rounded-box">
        <div class="hero-content text-center">
          <div>
            <XCircleIcon class="w-16 h-16 mx-auto mb-4 text-base-content/40" />
            <h1 class="text-3xl font-bold">暂无比赛</h1>
            <p class="py-6 text-base-content/60">请选择其他赛事类型或稍后再来</p>
            <button @click="gamesStore.selectAllLeagues" class="btn btn-primary">
              查看所有赛事
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="space-y-10">
        <div v-for="(games, date) in gamesStore.groupedGames" :key="date">
          <!-- Date Header -->
          <div class="divider">
            <div class="flex items-center gap-3 px-4 py-2 bg-base-200 rounded-full">
              <CalendarIcon class="w-5 h-5" />
              <span class="text-lg font-bold">{{ formatDate(date) }}</span>
              <span class="badge badge-primary">{{ games.length }}场</span>
            </div>
          </div>
          
          <!-- Games Grid -->
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
              v-for="game in games"
              :key="game.id"
              @click="selectGame(game)"
              class="group cursor-pointer"
            >
              <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <!-- Live Indicator -->
                <div v-if="isGameLive(game)" class="absolute top-2 right-2 z-10">
                  <span class="badge badge-error gap-1 animate-pulse">
                    <span class="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    LIVE
                  </span>
                </div>
                
                <!-- League Badge -->
                <div class="absolute top-2 left-2 z-10">
                  <span class="badge badge-primary badge-lg font-bold">
                    {{ game.league }}
                  </span>
                </div>
                
                <div class="card-body pt-12">
                  <!-- Teams -->
                  <div class="flex items-center justify-between gap-4">
                    <!-- Team 1 -->
                    <div class="flex-1 text-center">
                      <div class="avatar mb-2">
                        <div class="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          <img :src="game.team1Logo" :alt="game.team1" />
                        </div>
                      </div>
                      <h3 class="font-bold text-lg truncate">{{ game.team1 }}</h3>
                      <div v-if="game.team1Score" class="text-3xl font-black text-primary">
                        {{ game.team1Score }}
                      </div>
                    </div>
                    
                    <!-- VS -->
                    <div class="text-2xl font-black text-base-content/30">VS</div>
                    
                    <!-- Team 2 -->
                    <div class="flex-1 text-center">
                      <div class="avatar mb-2">
                        <div class="w-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2">
                          <img :src="game.team2Logo" :alt="game.team2" />
                        </div>
                      </div>
                      <h3 class="font-bold text-lg truncate">{{ game.team2 }}</h3>
                      <div v-if="game.team2Score" class="text-3xl font-black text-secondary">
                        {{ game.team2Score }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Time -->
                  <div class="text-center mt-4 pt-4 border-t border-base-200">
                    <div class="flex items-center justify-center gap-2 text-base-content/60">
                      <ClockIcon class="w-4 h-4" />
                      <span>{{ game.gameTime.split(' ')[1] }}</span>
                    </div>
                  </div>
                  
                  <!-- Hover Effect -->
                  <div class="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>
            </div>
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../stores/games'
import { useNavigationStore } from '../stores/navigation'
import LinkModal from '../components/LinkModal.vue'
import Toast from '../components/Toast.vue'
import {
  ArrowPathIcon,
  SunIcon,
  MoonIcon,
  PlayCircleIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  FireIcon,
  TrophyIcon,
  Squares2X2Icon,
  ClockIcon,
  XCircleIcon
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
const currentTime = ref('')

const isDark = computed(() => {
  return document.documentElement.getAttribute('data-theme') === 'dark'
})

const todayGamesCount = computed(() => {
  const today = new Date()
  const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
  return gamesStore.games.filter(game => game.gameTime.startsWith(todayStr)).length
})

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

function getLeagueCount(leagueId) {
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
  navigationStore.updateFocusableElements()
}

async function selectGame(game) {
  console.log('选择比赛:', game)
  currentGame.value = game
  
  if (game.liveLinks && game.liveLinks.length > 0) {
    const validLinks = game.liveLinks.filter(link => 
      link.url && link.url !== 'javascript:void(0)'
    )
    
    if (validLinks.length > 0) {
      const defaultLink = validLinks.find(link => 
        link.name.includes('高清') || link.name.includes('主播')
      ) || validLinks[0]
      
      linkLoading.value = true
      showLinkModal.value = true
      
      try {
        const links = await gamesStore.fetchLiveLinks(defaultLink.url)
        
        // 对链接进行排序，中文蓝光优先级最高
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
    } else {
      showToastMessage('暂无可用的直播源', 'warning')
    }
  } else {
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

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

let timeInterval

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  refreshGames()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px);
  background-size: 20px 20px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hover\:float:hover {
  animation: float 3s ease-in-out infinite;
}
</style>