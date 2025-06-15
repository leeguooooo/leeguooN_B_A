// Vercel定时任务策略
// 由于Vercel不支持传统的cron jobs，我们使用以下策略：

const CacheManager = require('./cacheManager');
const fetchGamesData = require('./fetchGamesDataFunction-working');

class VercelScheduler {
  constructor() {
    this.cache = new CacheManager();
  }

  // 策略1: 请求触发更新 (主要策略)
  // 每次API请求时检查缓存，过期则更新
  async handleGameRequest(req, res) {
    const authToken = process.env.KV_AUTH_TOKEN;
    
    try {
      const games = await this.cache.getGames(fetchGamesData, authToken);
      
      // 根据type过滤
      const { type } = req.query;
      const filteredGames = type 
        ? games.filter(game => game.league === type)
        : games;
      
      res.json(filteredGames);
    } catch (error) {
      console.error('获取比赛数据失败:', error);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  }

  // 策略2: Webhook触发更新
  // 可以配置外部服务定时调用这个接口
  async handleWebhookUpdate(req, res) {
    const authToken = process.env.KV_AUTH_TOKEN;
    const apiKey = req.header('X-Api-Key');

    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    if (!authToken) {
      return res.status(500).json({ error: 'KV auth token not configured' });
    }

    try {
      console.log('🔄 Webhook触发数据更新...');
      const games = await fetchGamesData();
      const success = await this.cache.cacheGamesAndStreams(games, {}, authToken);
      
      if (success) {
        res.json({ 
          success: true, 
          count: games.length,
          timestamp: Date.now()
        });
      } else {
        res.status(500).json({ error: 'Failed to update cache' });
      }
    } catch (error) {
      console.error('Webhook更新失败:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 策略3: 浏览器预热请求
  // 前端可以定时发送预热请求
  async handleWarmupRequest(req, res) {
    const authToken = process.env.KV_AUTH_TOKEN;
    
    if (!authToken) {
      return res.json({ 
        success: false, 
        message: 'KV not configured, using local cache only' 
      });
    }

    try {
      const shouldUpdate = await this.cache.shouldUpdateCache();
      
      if (shouldUpdate) {
        console.log('🔥 预热请求触发缓存更新...');
        // 异步更新，不阻塞响应
        this.cache.getGames(fetchGamesData, authToken);
        res.json({ success: true, message: 'Cache update triggered' });
      } else {
        res.json({ success: true, message: 'Cache is fresh' });
      }
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  }

  // 策略4: GitHub Actions定时任务
  // 可以配置GitHub Actions每30分钟调用webhook
  getGitHubActionsConfig() {
    return `
# .github/workflows/update-cache.yml
name: Update Sports Data Cache

on:
  schedule:
    # 每30分钟运行一次
    - cron: '*/30 * * * *'
  workflow_dispatch: # 手动触发

jobs:
  update-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Update Cache
        run: |
          curl -X POST "https://your-vercel-domain.com/api/webhook/update" \\
            -H "X-Api-Key: \${{ secrets.API_KEY }}" \\
            -H "Content-Type: application/json"
    `;
  }

  // 获取缓存状态
  async getCacheStatus() {
    const lastUpdate = await this.cache.getLastUpdate();
    const shouldUpdate = await this.cache.shouldUpdateCache();
    const cachedGames = await this.cache.getCachedGames();
    const cachedStreams = await this.cache.getCachedStreams();

    return {
      lastUpdate: new Date(lastUpdate).toISOString(),
      shouldUpdate,
      gamesCount: cachedGames ? cachedGames.length : 0,
      streamsCount: Object.keys(cachedStreams).length,
      cacheAge: Date.now() - lastUpdate,
      maxAge: 30 * 60 * 1000 // 30分钟
    };
  }
}

module.exports = VercelScheduler;