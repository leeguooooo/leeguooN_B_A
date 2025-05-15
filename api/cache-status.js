// 共享缓存变量 (注意: 这不会在无服务器环境中长期保存)
let cachedData = {
  games: null,
  timestamp: null,
  isRefreshing: false
};

// 更新缓存函数
function updateCache(newCacheData) {
  if (newCacheData) {
    cachedData = { ...newCacheData };
    console.log(`Cache updated with ${cachedData.games ? cachedData.games.length : 0} games at ${new Date().toISOString()}`);
  }
}

// Vercel API 路由处理函数
module.exports = async (req, res) => {
  // 只允许GET请求和正确的API密钥
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  try {
    // 如果是Vercel环境，提供缓存状态
    // 注意：由于Vercel的无服务器环境，这个状态可能不准确
    const now = new Date().getTime();
    const cacheAge = cachedData.timestamp ? now - cachedData.timestamp : null;
    const CACHE_REFRESH_INTERVAL = 15 * 60 * 1000; // 15分钟
    const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 60分钟
    
    return res.json({
      hasCachedData: !!cachedData.games,
      cacheTimestamp: cachedData.timestamp,
      cacheAge: cacheAge ? `${Math.round(cacheAge / 1000)} seconds` : null,
      gamesCount: cachedData.games ? cachedData.games.length : 0,
      isRefreshing: cachedData.isRefreshing,
      isCacheExpired: !cachedData.timestamp || (now - cachedData.timestamp > CACHE_EXPIRY_TIME),
      shouldRefresh: !cachedData.timestamp || (now - cachedData.timestamp > CACHE_REFRESH_INTERVAL)
    });
  } catch (error) {
    console.error('Error in cache-status:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 导出更新缓存函数
module.exports.updateCache = updateCache; 