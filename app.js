const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;
const fetchGamesData = require('./fetchGamesDataFunction');
require('dotenv').config();

// 缓存刷新间隔（毫秒）- 15分钟
const CACHE_REFRESH_INTERVAL = 15 * 60 * 1000;
// 缓存过期时间（毫秒）- 60分钟（如果超过此时间没有更新，将视为过期）
const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
// 延迟初始化时间（毫秒）- 用于Vercel冷启动优化
const INITIAL_LOAD_DELAY = process.env.VERCEL === '1' ? 1000 : 0;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' })); // 支持较大的JSON主体

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper function to filter games by type
function filterGamesByType(games, type) {
  return games.filter(game => game.league === type);
}

// Helper function to handle errors
function handleError(res, error) {
  console.error('Error:', error.message);
  res.status(500).json({ error: 'An error occurred while fetching data.' });
}

// Fetch HTML from URL and return Cheerio object
async function fetchHtml(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000, // 10秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      }
    });
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}

let cachedData = {
  games: null,
  timestamp: null,
  isRefreshing: false
};

// 后台刷新缓存，不阻塞 API 响应
async function refreshCacheInBackground() {
  // 如果已经有刷新进程在运行，就不要重复刷新
  if (cachedData.isRefreshing) return;
  
  cachedData.isRefreshing = true;
  
  try {
    console.log('Background refresh: Fetching games data...');
    const games = await fetchGamesData();
    
    if (games && games.length > 0) {
      cachedData.games = games;
      cachedData.timestamp = new Date().getTime();
      console.log(`Background refresh: Updated ${games.length} games at ${new Date().toISOString()}`);
    }
  } catch (error) {
    console.error('Background refresh error:', error.message);
  } finally {
    cachedData.isRefreshing = false;
  }
}

// 检查缓存是否需要刷新
function shouldRefreshCache() {
  // 如果没有缓存或缓存已超过刷新间隔
  return !cachedData.timestamp || (new Date().getTime() - cachedData.timestamp > CACHE_REFRESH_INTERVAL);
}

// 检查缓存是否已过期（长时间未更新）
function isCacheExpired() {
  return !cachedData.timestamp || (new Date().getTime() - cachedData.timestamp > CACHE_EXPIRY_TIME);
}

app.get('/api/games', async (req, res) => {
  const { type } = req.query;

  // 如果有缓存数据且未过期，直接使用缓存
  if (cachedData.games && !isCacheExpired()) {
    // 在后台刷新缓存（如果需要）
    if (shouldRefreshCache()) {
      // 对于Vercel，我们使用API调用而不是直接刷新
      if (process.env.VERCEL === '1') {
        // 在Vercel环境中，通过API调用触发刷新
        console.log('Triggering refresh via API on Vercel');
        try {
          const apiUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/manual-refresh`;
          fetch(apiUrl, {
            method: 'POST',
            headers: {
              'X-Api-Key': process.env.API_KEY,
            },
          }).catch(e => console.error('Background API refresh error:', e));
        } catch (error) {
          console.error('Failed to trigger background refresh:', error);
        }
      } else {
        // 在非Vercel环境，直接刷新
        refreshCacheInBackground();
      }
    }
    
    const games = type
      ? filterGamesByType(cachedData.games, type)
      : cachedData.games;
    
    return res.json(games);
  }

  // 如果缓存已过期或不存在，阻塞加载一次
  try {
    console.log('Initial/expired cache load: Fetching games data...');
    let games = await fetchGamesData();
    
    if (!games || games.length === 0) {
      throw new Error('Failed to fetch games data or empty response.');
    }

    cachedData.games = games;
    cachedData.timestamp = new Date().getTime();
    console.log(`Cache: Loaded ${games.length} games at ${new Date().toISOString()}`);

    games = type ? filterGamesByType(games, type) : games;
    res.json(games);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/parseLiveLinks', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: 'Missing URL parameter' });
    return;
  }

  const host = url.split('/').slice(0, 3).join('/');

  try {
    const $ = await fetchHtml(url);
    const subChannels = $('.sub_channel a.item');
    const liveLinks = [];

    subChannels.each((i, el) => {
      const subChannel = $(el);
      const name = subChannel.text();
      const urlPath = subChannel.attr('data-play');
      const url = `${host}${urlPath}`;
      liveLinks.push({ name, url });
    });

    res.json(liveLinks);
  } catch (error) {
    console.error('Error fetching live links:', error.message);
    res.status(500).json({ error: 'Failed to fetch live links' });
  }
});

app.post('/api/updateGames', async (req, res) => {
  console.log('Received games data update request');
  const apiKey = req.header('X-Api-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('Invalid API key');
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  try {
    // 使用express.json中间件，我们可以直接访问req.body
    const gamesData = req.body;

    if (!gamesData || !Array.isArray(gamesData) || gamesData.length === 0) {
      return res.status(400).json({ error: 'No valid games data provided' });
    }

    // 存储接收到的游戏数据和时间戳
    cachedData.games = gamesData;
    cachedData.timestamp = new Date().getTime();

    console.log(`Updated games data: ${gamesData.length} games at ${new Date().toISOString()}`);
    res.json({ success: true, count: gamesData.length });
  } catch (error) {
    console.error('Error updating games data:', error);
    res.status(500).json({ error: 'Error processing games data' });
  }
});

app.post('/fetchGamesData', async (req, res) => {
  console.log('Received request to refresh games data');
  const apiKey = req.header('X-Api-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('Invalid API key');
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  // 如果已经有刷新进程在运行，返回状态
  if (cachedData.isRefreshing) {
    return res.json({ status: 'refresh_in_progress' });
  }

  // 开始后台刷新
  if (process.env.VERCEL === '1') {
    // 在Vercel上，我们触发API调用
    try {
      const apiUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron-refresh`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger refresh: ${response.status}`);
      }
      
      const result = await response.json();
      return res.json({ success: true, status: 'refresh_triggered', result });
    } catch (error) {
      console.error('Error triggering refresh:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    // 在非Vercel环境，直接刷新
    refreshCacheInBackground();
    res.json({ success: true, status: 'refresh_started' });
  }
});

// 获取缓存状态的API
app.get('/api/cache-status', (req, res) => {
  const apiKey = req.header('X-Api-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  const now = new Date().getTime();
  const cacheAge = cachedData.timestamp ? now - cachedData.timestamp : null;
  
  res.json({
    hasCachedData: !!cachedData.games,
    cacheTimestamp: cachedData.timestamp,
    cacheAge: cacheAge ? `${Math.round(cacheAge / 1000)} seconds` : null,
    gamesCount: cachedData.games ? cachedData.games.length : 0,
    isRefreshing: cachedData.isRefreshing,
    isCacheExpired: isCacheExpired(),
    shouldRefresh: shouldRefreshCache()
  });
});

// 服务启动时预加载缓存
app.listen(port, async () => {
  console.log(`Server listening on port http://localhost:${port}`);
  
  // 在Vercel上，我们延迟初始化以避免冷启动问题
  if (INITIAL_LOAD_DELAY > 0) {
    console.log(`Delaying initial cache load by ${INITIAL_LOAD_DELAY}ms for cold start optimization`);
    setTimeout(initializeCache, INITIAL_LOAD_DELAY);
  } else {
    // 直接初始化
    initializeCache();
  }
});

// 初始化缓存函数
async function initializeCache() {
  // 启动时尝试加载缓存
  if (!cachedData.games) {
    try {
      console.log('Initial server start: Preloading games data...');
      const games = await fetchGamesData();
      if (games && games.length > 0) {
        cachedData.games = games;
        cachedData.timestamp = new Date().getTime();
        console.log(`Preloaded ${games.length} games on server start`);
      }
    } catch (error) {
      console.error('Failed to preload games data:', error.message);
    }
  }
}
