import axios from 'axios'

const KV_BASE_URL = 'https://dokv.pwtk.cc/kv'

export const kvApi = {
  async getGames(forceRefresh) {
    try {
      // 使用正确的 key 格式: games/jrs/all
      const response = await axios.get(`${KV_BASE_URL}/games/jrs/all`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        // 强制刷新时禁用 axios 缓存
        ...(forceRefresh && { 
          cache: false,
          params: { _: Date.now() } // 某些 CDN 会忽略 headers，用这个作为备用
        })
      })
      
      if (response.data) {
        return response.data
      }
      
      return []
    } catch (error) {
      console.error('Failed to fetch games from KV:', error)
      return []
    }
  },

  async getLastUpdateTime() {
    try {
      const response = await axios.get(`${KV_BASE_URL}/games/jrs/last_update`, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (response.data) {
        return response.data
      }
      
      return null
    } catch (error) {
      console.error('Failed to fetch last update time from KV:', error)
      return null
    }
  },

  async getLiveLinks(url) {
    try {
      const encodedUrl = encodeURIComponent(url)
      const response = await axios.get(`${KV_BASE_URL}/live_links_${encodedUrl}`, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (response.data) {
        return response.data
      }
      
      return null
    } catch (error) {
      console.error('Failed to fetch live links from KV:', error)
      return null
    }
  },

  async getStreamUrl(url) {
    try {
      const encodedUrl = encodeURIComponent(url)
      const response = await axios.get(`${KV_BASE_URL}/stream_url_${encodedUrl}`, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (response.data) {
        return response.data
      }
      
      return null
    } catch (error) {
      console.error('Failed to fetch stream URL from KV:', error)
      return null
    }
  }
}