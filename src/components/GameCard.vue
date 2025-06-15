<template>
  <div 
    class="card bg-base-300 shadow-xl card-hover cursor-pointer"
    @click="$emit('select', game)"
  >
    <div class="card-body">
      <!-- League Badge -->
      <div class="badge badge-primary badge-lg mb-2">
        {{ game.league }}
      </div>
      
      <!-- Teams -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <img 
            v-if="game.team1Logo" 
            :src="game.team1Logo" 
            :alt="game.team1"
            class="w-12 h-12 object-contain"
            @error="handleImageError"
          >
          <div class="flex-1">
            <h3 class="font-bold text-lg">{{ game.team1 }}</h3>
          </div>
          <div v-if="game.team1Score" class="text-2xl font-bold">
            {{ game.team1Score }}
          </div>
        </div>
        
        <div class="divider my-2">VS</div>
        
        <div class="flex items-center gap-3">
          <img 
            v-if="game.team2Logo" 
            :src="game.team2Logo" 
            :alt="game.team2"
            class="w-12 h-12 object-contain"
            @error="handleImageError"
          >
          <div class="flex-1">
            <h3 class="font-bold text-lg">{{ game.team2 }}</h3>
          </div>
          <div v-if="game.team2Score" class="text-2xl font-bold">
            {{ game.team2Score }}
          </div>
        </div>
      </div>
      
      <!-- Game Time -->
      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ClockIcon class="w-5 h-5 text-primary" />
          <span class="text-lg font-bold text-primary">{{ formatGameTime(game.gameTime) }}</span>
          <span class="text-sm text-base-content/60">{{ getGameDate(game.gameTime) }}</span>
        </div>
        
        <!-- Live Indicator -->
        <div v-if="isLive" class="badge badge-success gap-1">
          <div class="w-2 h-2 bg-current rounded-full animate-pulse"></div>
          直播中
        </div>
      </div>
      
      <!-- Live Sources -->
      <div v-if="game.liveLinks && game.liveLinks.length > 0" class="mt-4">
        <div class="flex flex-wrap gap-1">
          <div 
            v-for="(link, index) in game.liveLinks.slice(0, 3)" 
            :key="index"
            class="badge badge-outline badge-sm"
          >
            {{ link.name }}
          </div>
          <div 
            v-if="game.liveLinks.length > 3" 
            class="badge badge-ghost badge-sm"
          >
            +{{ game.liveLinks.length - 3 }}
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
  return new Date(year, month - 1, day, hour, minute)
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