const axios = require('axios');
require('dotenv').config();

// 定义请求超时
const REQUEST_TIMEOUT = 30000; // 30秒
// 定义刷新间隔（默认每15分钟）
const REFRESH_INTERVAL = process.env.REFRESH_INTERVAL || 15 * 60 * 1000;

// 刷新缓存函数
async function refreshCache() {
  try {
    console.log(`[${new Date().toISOString()}] 触发缓存刷新...`);
    
    const apiUrl = process.env.VERCEL_API_URL || 'http://localhost:3000/fetchGamesData';
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set');
    }
    
    const startTime = Date.now();
    const response = await axios.post(apiUrl, {}, {
      headers: {
        'X-Api-Key': apiKey,
      },
      timeout: REQUEST_TIMEOUT
    });
    
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] 缓存刷新结果: ${JSON.stringify(response.data)} (${duration}ms)`);
    
    return response.data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 缓存刷新错误:`, error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
}

// 定时执行函数
function scheduleRefresh() {
  console.log(`[${new Date().toISOString()}] 设置缓存刷新间隔: ${REFRESH_INTERVAL / 1000}秒`);
  
  // 立即执行一次
  refreshCache()
    .then(() => console.log(`[${new Date().toISOString()}] 初始刷新完成，下次刷新将在 ${REFRESH_INTERVAL / 1000}秒后`))
    .catch(err => console.error(`[${new Date().toISOString()}] 初始刷新失败:`, err.message));
  
  // 设置定时器
  setInterval(async () => {
    try {
      await refreshCache();
      console.log(`[${new Date().toISOString()}] 定时刷新完成，下次刷新将在 ${REFRESH_INTERVAL / 1000}秒后`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] 定时刷新失败:`, err.message);
    }
  }, REFRESH_INTERVAL);
}

// 启动定时刷新
scheduleRefresh(); 