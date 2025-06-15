// Webhook endpoint for cache updates (triggered by GitHub Actions)
const fetchGamesData = require('../../fetchGamesDataFunction-working');
const CacheManager = require('../../cacheManager');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证 API Key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cacheManager = new CacheManager();
  const authToken = process.env.KV_AUTH_TOKEN;

  if (!authToken) {
    console.error('KV_AUTH_TOKEN not configured');
    return res.status(500).json({ error: 'Cache service not configured' });
  }

  try {
    console.log('[Webhook] Starting cache update...');
    
    // 抓取最新数据
    const startTime = Date.now();
    const freshGames = await fetchGamesData();
    const fetchTime = Date.now() - startTime;
    
    console.log(`[Webhook] Fetched ${freshGames.length} games in ${fetchTime}ms`);

    // 更新缓存（只更新游戏数据）
    const cacheStart = Date.now();
    await cacheManager.cacheGamesOnly(freshGames, authToken);
    const cacheTime = Date.now() - cacheStart;
    
    console.log(`[Webhook] Cache updated in ${cacheTime}ms`);
    
    return res.status(200).json({ 
      success: true, 
      gamesCount: freshGames.length,
      fetchTime,
      cacheTime,
      totalTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Webhook] Cache update failed:', error);
    return res.status(500).json({ 
      error: 'Cache update failed',
      message: error.message 
    });
  }
}

module.exports.config = {
  maxDuration: 30
};