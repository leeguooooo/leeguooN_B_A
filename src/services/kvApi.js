import axios from 'axios'

const KV_BASE_URL = 'https://dokv.pwtk.cc/kv'

export const kvApi = {
  async getGames() {
    try {
      const response = await axios.get(`${KV_BASE_URL}/games_cache`, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (response.data && response.data.data) {
        return response.data.data
      }
      
      return []
    } catch (error) {
      console.error('Failed to fetch games from KV:', error)
      return []
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