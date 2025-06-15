// 获取比赛数据的 API 端点
const CacheManager = require('../cacheManager');
const fetchGamesData = require('../fetchGamesDataFunction-working');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cacheManager = new CacheManager();

  try {
    // 获取查询参数
    const { type, force } = req.query;
    
    // 如果强制刷新（需要API_KEY）
    if (force === 'true') {
      const apiKey = req.headers['x-api-key'];
      if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Invalid API key for force refresh' });
      }
    }

    // 获取比赛数据
    const games = await cacheManager.getGames(
      fetchGamesData,
      process.env.KV_AUTH_TOKEN
    );

    // 根据类型过滤
    let filteredGames = games;
    if (type) {
      filteredGames = games.filter(game => 
        game.league.toLowerCase().includes(type.toLowerCase())
      );
    }

    // 设置缓存头
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5分钟缓存
    
    return res.status(200).json(filteredGames);
  } catch (error) {
    console.error('[API] 获取比赛数据失败:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch games',
      message: error.message 
    });
  }
}

module.exports.config = {
  maxDuration: 30
};