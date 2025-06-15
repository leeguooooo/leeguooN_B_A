<template>
  <div 
    @click="$emit('click')"
    class="group relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/10 border border-white/5 hover:border-red-500/30"
  >
    <!-- Live Badge -->
    <div v-if="isLive" class="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
      <div class="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg shadow-red-500/50">
        <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></span>
        <span>LIVE</span>
      </div>
    </div>
    
    <!-- League Badge -->
    <div class="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
      <div class="bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/20">
        {{ game.league }}
      </div>
    </div>
    
    <!-- Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[5]"></div>
    
    <!-- Background Image -->
    <div class="absolute inset-0">
      <img 
        :src="getBackgroundImage(game.league)"
        alt=""
        class="w-full h-full object-cover opacity-50"
      >
    </div>
    
    <!-- Content -->
    <div class="relative z-10 p-4 sm:p-6 pt-16 sm:pt-20">
      <!-- Teams -->
      <div class="flex items-center justify-between mb-4 sm:mb-6">
        <!-- Team 1 -->
        <div class="flex-1 text-center">
          <div class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1.5 sm:mb-2 bg-white/10 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
            <img 
              :src="game.team1Logo" 
              :alt="game.team1"
              class="w-full h-full object-contain"
              @error="handleImageError"
            >
          </div>
          <h3 class="text-white font-medium text-xs sm:text-sm truncate px-1">{{ game.team1 }}</h3>
          <div v-if="game.team1Score" class="text-lg sm:text-2xl font-bold text-white mt-0.5 sm:mt-1">
            {{ game.team1Score }}
          </div>
        </div>
        
        <!-- VS / Time -->
        <div class="px-2 sm:px-4 text-center flex-shrink-0">
          <div v-if="isLive" class="text-white/80 text-xs sm:text-sm font-medium">
            进行中
          </div>
          <div v-else class="space-y-1">
            <div class="text-white font-bold text-sm sm:text-base">
              {{ formatTime(game.gameTime) }}
            </div>
            <div class="text-white/50 text-[10px] sm:text-xs">
              {{ formatDate(game.gameTime) }}
            </div>
          </div>
        </div>
        
        <!-- Team 2 -->
        <div class="flex-1 text-center">
          <div class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1.5 sm:mb-2 bg-white/10 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
            <img 
              :src="game.team2Logo" 
              :alt="game.team2"
              class="w-full h-full object-contain"
              @error="handleImageError"
            >
          </div>
          <h3 class="text-white font-medium text-xs sm:text-sm truncate px-1">{{ game.team2 }}</h3>
          <div v-if="game.team2Score" class="text-lg sm:text-2xl font-bold text-white mt-0.5 sm:mt-1">
            {{ game.team2Score }}
          </div>
        </div>
      </div>
      
      <!-- Watch Button with Stream Count -->
      <div class="sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
        <button class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 text-sm sm:text-base shadow-lg shadow-red-500/30">
          <PlayIcon class="w-4 h-4 sm:w-5 sm:h-5" />
          <span>立即观看</span>
          <span v-if="game.liveLinks && game.liveLinks.length > 0" class="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {{ game.liveLinks.length }} 源
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { PlayIcon } from '@heroicons/vue/24/solid'

defineProps({
  game: {
    type: Object,
    required: true
  },
  isLive: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

function getBackgroundImage(league) {
  const backgrounds = {
    'NBA': 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&h=300&fit=crop',
    'CBA': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
    '英超': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=300&fit=crop',
    '西甲': 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=300&fit=crop',
    '德甲': 'https://images.unsplash.com/photo-1518604964608-9fe1f2cab6f1?w=400&h=300&fit=crop',
    '意甲': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=300&fit=crop',
    '法甲': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop',
    '欧冠': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=400&h=300&fit=crop'
  }
  return backgrounds[league] || backgrounds['NBA']
}

function handleImageError(e) {
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMzMzMzMzMiLz4KPHBhdGggZD0iTTMyIDIwQzI1LjM3MyAyMCAyMCAyNS4zNzMgMjAgMzJDMjAgMzguNjI3IDI1LjM3MyA0NCAzMiA0NEMzOC42MjcgNDQgNDQgMzguNjI3IDQ0IDMyQzQ0IDI1LjM3MyAzOC42MjcgMjAgMzIgMjBaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+'
}

function formatTime(gameTime) {
  const [date, time] = gameTime.split(' ')
  return time
}

function formatDate(gameTime) {
  const [date, time] = gameTime.split(' ')
  const [month, day] = date.split('-')
  
  // 获取今天的日期
  const today = new Date()
  const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0')
  const todayDay = today.getDate().toString().padStart(2, '0')
  
  // 获取明天的日期
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowMonth = (tomorrow.getMonth() + 1).toString().padStart(2, '0')
  const tomorrowDay = tomorrow.getDate().toString().padStart(2, '0')
  
  if (month === todayMonth && day === todayDay) {
    return '今天'
  } else if (month === tomorrowMonth && day === tomorrowDay) {
    return '明天'
  } else {
    return `${month}/${day}`
  }
}
</script>