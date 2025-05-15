const axios = require('axios');
const fetchGamesData = require('./fetchGamesDataFunction');
require('dotenv').config();

// 错误重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 30000; // 30秒

// 添加随机延迟以避免同时请求（1-5秒）
function getRandomDelay() {
  return Math.floor(Math.random() * 4000) + 1000;
}

async function updateGameData(retryCount = 0) {
  try {
    console.log(`Fetching games data (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
    const startTime = Date.now();
    
    const gamesData = await fetchGamesData();
    
    if (!gamesData || gamesData.length === 0) {
      throw new Error('No games data returned or empty data');
    }
    
    const apiUrl =
      process.env.VERCEL_API_URL || 'http://localhost:3000/api/updateGames';
    const apiKey = process.env.API_KEY;

    const res = await axios.post(apiUrl, gamesData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      timeout: 30000, // 30秒超时
    });

    const duration = Date.now() - startTime;
    console.log(`Games data sent to API. Processed ${gamesData.length} games in ${duration}ms`, res.data);
    
    return true;
  } catch (error) {
    console.error('Error updating games data:', error.message);
    
    // 重试逻辑
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY + getRandomDelay();
      console.log(`Retrying in ${delay/1000} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return updateGameData(retryCount + 1);
    }
    
    console.error(`Failed to update games data after ${MAX_RETRIES + 1} attempts`);
    return false;
  }
}

// 立即执行一次
(async () => {
  await updateGameData();
})();
