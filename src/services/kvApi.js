import axios from 'axios'

const KV_BASE_URL = 'https://dokv.pwtk.cc/kv'

export const kvApi = {
  async getGames() {
    try {
      // 使用正确的 key 格式: games/jrs/all
      const response = await axios.get(`${KV_BASE_URL}/games/jrs/all`, {
        headers: {
          'Accept': 'application/json',
        }
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
      // 生成简单的 key，避免编码问题
      // 从 URL 中提取关键部分作为 key
      const urlMatch = url.match(/steam(\d+)\.html/);
      const streamId = urlMatch ? urlMatch[1] : url.split('/').pop();
      const kvKey = `livelinks_${streamId}`;
      
      const response = await axios.get(`${KV_BASE_URL}/${kvKey}`, {
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
      // 生成简单的 key，避免编码问题
      const urlMatch = url.match(/steam(\d+)\.html/);
      const streamId = urlMatch ? urlMatch[1] : url.split('/').pop();
      const kvKey = `stream_${streamId}`;
      
      const response = await axios.get(`${KV_BASE_URL}/${kvKey}`, {
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