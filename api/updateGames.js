// 共享缓存变量 (注意: 这不会在无服务器环境中长期保存)
let cachedData = {
  games: null,
  timestamp: null,
  isRefreshing: false
};

// Vercel API 路由处理函数
module.exports = async (req, res) => {
  // 只允许POST请求和正确的API密钥
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('Invalid API key');
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  try {
    // 解析请求体
    let gamesData;
    
    if (typeof req.body === 'string') {
      gamesData = JSON.parse(req.body);
    } else if (Buffer.isBuffer(req.body)) {
      gamesData = JSON.parse(req.body.toString());
    } else {
      gamesData = req.body;
    }
    
    if (!gamesData || !Array.isArray(gamesData) || gamesData.length === 0) {
      return res.status(400).json({ error: 'No valid games data provided' });
    }
    
    // 存储接收到的游戏数据和时间戳
    cachedData.games = gamesData;
    cachedData.timestamp = new Date().getTime();
    
    console.log(`[${new Date().toISOString()}] Updated games data: ${gamesData.length} games`);
    
    // 更新共享缓存 (在api/cache-status.js中使用)
    const cacheStatusModule = require('./cache-status');
    if (cacheStatusModule.updateCache) {
      cacheStatusModule.updateCache(cachedData);
    }
    
    return res.status(200).json({ 
      success: true, 
      count: gamesData.length,
      timestamp: cachedData.timestamp
    });
  } catch (error) {
    console.error('Error updating games data:', error);
    return res.status(500).json({ error: 'Error processing games data' });
  }
}; 