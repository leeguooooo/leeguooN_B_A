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
      // 有比分的比赛就是正在直播的比赛
      const hasScore = (game.team1Score && game.team1Score !== '') || 
                       (game.team2Score && game.team2Score !== '')
      
      if (hasScore) {
        return true
      }
      
      // 如果没有比分，但比赛时间在合理范围内，也可能是刚开始的比赛
      const now = new Date()
      const gameDate = parseGameTime(game.gameTime)
      const timeDiff = now - gameDate
      
      // 比赛开始后15分钟内，即使没有比分也显示为直播（可能刚开始）
      return timeDiff >= 0 && timeDiff <= 15 * 60 * 1000
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
      let data, updateTime
      
      // 检查是否使用本地API（开发模式）
      if (import.meta.env.VITE_USE_LOCAL_API === 'true') {
        console.log('使用本地API获取数据...')
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/games`)
        if (!response.ok) throw new Error('Failed to fetch from local API')
        const result = await response.json()
        data = result.games || result
        updateTime = result.timestamp || Date.now()
      } else {
        // 使用KV API
        console.log('使用KV API获取数据...')
        const results = await Promise.all([
          kvApi.getGames(),
          kvApi.getLastUpdateTime()
        ])
        data = results[0]
        updateTime = results[1]
      }
      
      games.value = data || []
      lastUpdateTime.value = updateTime
      console.log(`成功获取 ${games.value.length} 场比赛数据`)
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch games:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchLiveLinks(url) {
    try {
      // 先尝试从 KV 缓存获取
      console.log('尝试从 KV 缓存获取直播链接...')
      const cachedLinks = await kvApi.getLiveLinks(url)
      
      if (cachedLinks) {
        console.log('从 KV 缓存获取到直播链接:', cachedLinks.length, '个')
        return cachedLinks
      }
      
      // 如果缓存没有，则实时解析
      console.log('KV 缓存未命中，实时解析直播链接...')
      const response = await axios.get('/api/parseLiveLinks', {
        params: { url }
      })
      
      // 检查是否有错误信息
      if (response.data.errorCode) {
        console.warn(`[API] ${response.data.errorType}: ${response.data.message}`)
        console.warn(`[API] Suggestion: ${response.data.suggestion}`)
        
        // 对于 403 等错误，返回空数组而不是抛出异常
        if (response.data.liveLinks !== undefined) {
          return response.data.liveLinks
        }
      }
      
      // TODO: 可以考虑将解析结果写入 KV 缓存
      
      return response.data
    } catch (err) {
      console.error('Failed to fetch live links:', err)
      
      // 如果是网络错误，返回空数组而不是抛出异常
      if (err.response && err.response.status >= 400) {
        console.warn('Network error, returning empty links')
        return []
      }
      
      throw err
    }
  }
  
  async function getStreamUrl(url) {
    try {
      // 先尝试从 KV 缓存获取
      console.log('尝试从 KV 缓存获取流地址...')
      const cachedStream = await kvApi.getStreamUrl(url)
      
      if (cachedStream && cachedStream.streamUrl) {
        console.log('从 KV 缓存获取到流地址')
        return cachedStream
      }
      
      // 如果缓存没有，则实时解析
      console.log('KV 缓存未命中，实时解析流地址...')
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
      
      // TODO: 可以考虑将解析结果写入 KV 缓存
      
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