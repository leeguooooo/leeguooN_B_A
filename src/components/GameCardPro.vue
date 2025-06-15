<template>
  <div 
    @click="$emit('click')"
    class="group relative bg-[#1a1a1a] rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl"
  >
    <!-- Live Badge -->
    <div v-if="isLive" class="absolute top-4 left-4 z-10">
      <div class="flex items-center space-x-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
        <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        <span>LIVE</span>
      </div>
    </div>
    
    <!-- League Badge -->
    <div class="absolute top-4 right-4 z-10">
      <div class="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
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
    <div class="relative z-10 p-6 pt-20">
      <!-- Teams -->
      <div class="flex items-center justify-between mb-6">
        <!-- Team 1 -->
        <div class="flex-1 text-center">
          <div class="w-16 h-16 mx-auto mb-2 bg-white/10 backdrop-blur-sm rounded-full p-2">
            <img 
              :src="game.team1Logo" 
              :alt="game.team1"
              class="w-full h-full object-contain"
              @error="handleImageError"
            >
          </div>
          <h3 class="text-white font-medium text-sm">{{ game.team1 }}</h3>
          <div v-if="game.team1Score" class="text-2xl font-bold text-white mt-1">
            {{ game.team1Score }}
          </div>
        </div>
        
        <!-- VS / Time -->
        <div class="px-4 text-center">
          <div v-if="isLive" class="text-white/60 text-sm">
            进行中
          </div>
          <div v-else class="text-white/60 text-sm">
            {{ game.gameTime.split(' ')[1] }}
          </div>
        </div>
        
        <!-- Team 2 -->
        <div class="flex-1 text-center">
          <div class="w-16 h-16 mx-auto mb-2 bg-white/10 backdrop-blur-sm rounded-full p-2">
            <img 
              :src="game.team2Logo" 
              :alt="game.team2"
              class="w-full h-full object-contain"
              @error="handleImageError"
            >
          </div>
          <h3 class="text-white font-medium text-sm">{{ game.team2 }}</h3>
          <div v-if="game.team2Score" class="text-2xl font-bold text-white mt-1">
            {{ game.team2Score }}
          </div>
        </div>
      </div>
      
      <!-- Watch Button -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition flex items-center justify-center space-x-2">
          <PlayIcon class="w-5 h-5" />
          <span>立即观看</span>
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
</script>