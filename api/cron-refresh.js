const fetchGamesData = require('../fetchJrsGamesData');
const fetch = require('node-fetch');

// 用于存储最后一次执行时间的变量（这个变量不会在调用之间保留）
let lastRun = null;

// Vercel API 路由处理函数
module.exports = async (req, res) => {
  // 只允许 Vercel Cron 或内部调用
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isInternalCall = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isVercelCron && !isInternalCall) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log(`[${new Date().toISOString()}] Cron job started for refreshing games data`);
  
  try {
    const startTime = Date.now();
    const games = await fetchGamesData();
    
    if (!games || games.length === 0) {
      throw new Error('No games data returned or empty data');
    }
    
    const duration = Date.now() - startTime;
    console.log(`Fetched ${games.length} games in ${duration}ms`);
    
    // 调用更新缓存的API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    const updateUrl = `${baseUrl}/api/updateGames`;
    
    console.log(`Updating cache at: ${updateUrl}`);
    
    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.API_KEY,
      },
      body: JSON.stringify(games),
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update cache: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
    }
    
    const result = await updateResponse.json();
    lastRun = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      games: games.length,
      duration: `${duration}ms`,
      lastRun,
      result
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      lastRun
    });
  }
}; 