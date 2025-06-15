<template>
  <div 
    class="card bg-base-300 shadow-xl card-hover cursor-pointer"
    @click="$emit('select', game)"
  >
    <div class="card-body p-3 sm:p-6">
      <!-- League Badge -->
      <div class="badge badge-primary badge-md sm:badge-lg mb-2">
        {{ game.league }}
      </div>
      
      <!-- Teams -->
      <div class="space-y-3 sm:space-y-4">
        <div class="flex items-center gap-2 sm:gap-3">
          <img 
            v-if="game.team1Logo" 
            :src="game.team1Logo" 
            :alt="game.team1"
            class="w-8 h-8 sm:w-12 sm:h-12 object-contain"
            @error="handleImageError"
          >
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-base sm:text-lg truncate">{{ game.team1 }}</h3>
          </div>
          <div v-if="game.team1Score" class="text-xl sm:text-2xl font-bold flex-shrink-0">
            {{ game.team1Score }}
          </div>
        </div>
        
        <div class="divider my-1 sm:my-2 text-xs sm:text-base">VS</div>
        
        <div class="flex items-center gap-2 sm:gap-3">
          <img 
            v-if="game.team2Logo" 
            :src="game.team2Logo" 
            :alt="game.team2"
            class="w-8 h-8 sm:w-12 sm:h-12 object-contain"
            @error="handleImageError"
          >
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-base sm:text-lg truncate">{{ game.team2 }}</h3>
          </div>
          <div v-if="game.team2Score" class="text-xl sm:text-2xl font-bold flex-shrink-0">
            {{ game.team2Score }}
          </div>
        </div>
      </div>
      
      <!-- Game Time -->
      <div class="mt-3 sm:mt-4 flex items-center justify-between">
        <div class="flex items-center gap-1 sm:gap-2">
          <ClockIcon class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span class="text-base sm:text-lg font-bold text-primary">{{ formatGameTime(game.gameTime) }}</span>
          <span class="text-xs sm:text-sm text-base-content/60">{{ getGameDate(game.gameTime) }}</span>
        </div>
        
        <!-- Live Indicator -->
        <div v-if="isLive" class="badge badge-success badge-sm sm:badge-md gap-1">
          <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full animate-pulse"></div>
          <span class="text-xs sm:text-sm">直播中</span>
        </div>
      </div>
      
      <!-- Live Sources -->
      <div v-if="game.liveLinks && game.liveLinks.length > 0" class="mt-3 sm:mt-4">
        <div class="flex flex-wrap gap-1">
          <div 
            v-for="(link, index) in game.liveLinks.slice(0, 2)" 
            :key="index"
            class="badge badge-outline badge-xs sm:badge-sm"
          >
            {{ link.name }}
          </div>
          <div 
            v-if="game.liveLinks.length > 2" 
            class="badge badge-ghost badge-xs sm:badge-sm"
          >
            +{{ game.liveLinks.length - 2 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select'])

const isLive = computed(() => {
  const now = new Date()
  const gameTime = parseGameTime(props.game.gameTime)
  const timeDiff = now - gameTime
  return timeDiff >= 0 && timeDiff <= 3 * 60 * 60 * 1000
})

function parseGameTime(gameTime) {
  const [date, time] = gameTime.split(' ')
  const [month, day] = date.split('-')
  const [hour, minute] = time.split(':')
  const year = new Date().getFullYear()
  
  // 假设游戏时间是中国时间 (UTC+8)
  // 创建一个 UTC 时间，然后减去 8 小时的偏移
  const chinaTime = new Date(year, month - 1, day, hour, minute)
  const chinaOffset = 8 * 60 // 中国时区是 UTC+8，转换为分钟
  const localOffset = new Date().getTimezoneOffset() // 本地时区偏移（分钟）
  const offsetDiff = chinaOffset + localOffset // 总偏移差
  
  // 调整时间到本地时区
  return new Date(chinaTime.getTime() - offsetDiff * 60 * 1000)
}

function formatGameTime(gameTime) {
  const [date, time] = gameTime.split(' ')
  return time
}

function getGameDate(gameTime) {
  const [date, time] = gameTime.split(' ')
  const [month, day] = date.split('-')
  return `${month}/${day}`
}

function handleImageError(event) {
  // 图片加载失败时隐藏
  event.target.style.display = 'none'
}
</script>