import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { kvApi } from '@/services/kvApi'
import axios from 'axios'

export const useGamesStore = defineStore('games', () => {
  const games = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedLeagues = ref(['NBA', '日职联'])
  const lastUpdateTime = ref(null)
  
  const leagues = ref([
    { id: 'NBA', name: 'NBA', icon: '🏀' },
    { id: 'CBA', name: 'CBA', icon: '🏀' },
    { id: '英超', name: '英超', icon: '⚽' },
    { id: '西甲', name: '西甲', icon: '⚽' },
    { id: '德甲', name: '德甲', icon: '⚽' },
    { id: '意甲', name: '意甲', icon: '⚽' },
    { id: '法甲', name: '法甲', icon: '⚽' },
    { id: '日职联', name: '日职联', icon: '⚽' },
    { id: '欧冠', name: '欧冠', icon: '🏆' },
  ])
  
  const filteredGames = computed(() => {
    console.log('Total games:', games.value.length)
    console.log('Selected leagues:', selectedLeagues.value)
    
    if (selectedLeagues.value.length === 0) {
      return games.value
    }
    
    const filtered = games.value.filter(game => 
      selectedLeagues.value.includes(game.league)
    )
    
    console.log('Filtered games:', filtered.length)
    return filtered
  })
  
  const groupedGames = computed(() => {
    const grouped = {}
    const today = new Date()
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    console.log('Today is:', todayStr)
    
    filteredGames.value.forEach(game => {
      const date = game.gameTime.split(' ')[0]
      
      // 只显示今天及以后的比赛
      if (date >= todayStr) {
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(game)
      }
    })
    
    console.log('Grouped games dates:', Object.keys(grouped))
    return grouped
  })
  
  const liveGames = computed(() => {
    return filteredGames.value.filter(game => {
      // 根据比赛时间判断是否正在进行
      const now = new Date()
      const gameDate = parseGameTime(game.gameTime)
      const timeDiff = now - gameDate
      // 假设比赛持续3小时
      return timeDiff >= 0 && timeDiff <= 3 * 60 * 60 * 1000
    })
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
  
  async function fetchGames() {
    loading.value = true
    error.value = null
    
    try {
      const [data, updateTime] = await Promise.all([
        kvApi.getGames(),
        kvApi.getLastUpdateTime()
      ])
      games.value = data
      lastUpdateTime.value = updateTime
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch games:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchLiveLinks(url) {
    try {
      const response = await axios.get('/api/parseLiveLinks', {
        params: { url }
      })
      return response.data
    } catch (err) {
      console.error('Failed to fetch live links:', err)
      throw err
    }
  }
  
  async function getStreamUrl(url) {
    try {
      const response = await axios.get('/api/getStreamUrl', {
        params: { url }
      })
      
      // 验证返回的数据
      if (response.data.error) {
        throw new Error(response.data.error)
      }
      
      // 验证流地址有效性
      const streamUrl = response.data.streamUrl
      if (!streamUrl || streamUrl.includes('"+') || streamUrl === '"+id+"') {
        throw new Error('获取到的流地址无效，请尝试其他直播源')
      }
      
      return response.data
    } catch (err) {
      console.error('Failed to get stream URL:', err)
      throw err
    }
  }
  
  function toggleLeague(leagueId) {
    const index = selectedLeagues.value.indexOf(leagueId)
    if (index > -1) {
      selectedLeagues.value.splice(index, 1)
    } else {
      selectedLeagues.value.push(leagueId)
    }
  }
  
  function selectOnlyLeague(leagueId) {
    selectedLeagues.value = [leagueId]
  }
  
  function selectAllLeagues() {
    selectedLeagues.value = leagues.value.map(l => l.id)
  }
  
  function clearLeagues() {
    selectedLeagues.value = []
  }
  
  return {
    games,
    loading,
    error,
    leagues,
    selectedLeagues,
    lastUpdateTime,
    filteredGames,
    groupedGames,
    liveGames,
    fetchGames,
    fetchLiveLinks,
    getStreamUrl,
    toggleLeague,
    selectOnlyLeague,
    selectAllLeagues,
    clearLeagues
  }
})