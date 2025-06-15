// Vercel Cron Job - 定时更新缓存
const fetchGamesData = require('../../fetchGamesDataFunction-working');
const CacheManager = require('../../cacheManager');

export default async function handler(req, res) {
  // 验证是否是 Vercel Cron 调用
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cacheManager = new CacheManager();
  const authToken = process.env.KV_AUTH_TOKEN;

  if (!authToken) {
    console.error('KV_AUTH_TOKEN not configured');
    return res.status(500).json({ error: 'Cache service not configured' });
  }

  try {
    console.log('Starting scheduled cache update...');
    
    // 抓取最新数据
    const freshGames = await fetchGamesData();
    console.log(`Fetched ${freshGames.length} games`);

    // 更新缓存（不解析流地址，避免超时）
    await cacheManager.cacheGamesOnly(freshGames, authToken);
    
    console.log('Cache updated successfully');
    return res.status(200).json({ 
      success: true, 
      gamesCount: freshGames.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache update failed:', error);
    return res.status(500).json({ 
      error: 'Cache update failed',
      message: error.message 
    });
  }
}

// Vercel Cron 配置
export const config = {
  maxDuration: 30
};