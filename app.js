const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;
const fetchGamesData = require('./fetchGamesDataFunction-working');
const getFullIframeSrc = require('./decode_url.js');
const VercelScheduler = require('./scheduler');
const StreamQueue = require('./streamQueue');
const proxyM3U8 = require('./m3u8-proxy');

require('dotenv').config();

const scheduler = new VercelScheduler();
const streamQueue = new StreamQueue();

// 在开发模式下，使用Vite处理
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
} else {
  // 生产模式下，使用构建后的文件
  app.use(express.static(path.join(__dirname, 'dist')));
}

app.get('/', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
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
    const response = await axios.get(url);
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}

// 移除本地缓存，完全使用KV存储
// 使用新的智能缓存系统
app.get('/api/games', (req, res) => scheduler.handleGameRequest(req, res));

// 添加预热和状态路由
app.get('/api/warmup', (req, res) => scheduler.handleWarmupRequest(req, res));
app.get('/api/cache-status', async (req, res) => {
  try {
    const status = await scheduler.getCacheStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/webhook/update', (req, res) => scheduler.handleWebhookUpdate(req, res));

// 流解析队列API
app.post('/api/queue/add', async (req, res) => {
  try {
    const games = await scheduler.cache.getCachedGames();
    if (!games || games.length === 0) {
      return res.json({ error: '没有可用的比赛数据' });
    }

    let added = 0;
    games.forEach(game => {
      if (streamQueue.addGame(game)) {
        added++;
      }
    });

    res.json({ 
      success: true, 
      message: `已添加 ${added} 场比赛到解析队列`,
      queueStatus: streamQueue.getStatus()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue/status', (req, res) => {
  const status = streamQueue.getStatus();
  const results = streamQueue.getAllResults();
  res.json({ ...status, results });
});

app.get('/api/queue/results', (req, res) => {
  const results = streamQueue.getSuccessResults();
  res.json(results);
});

app.post('/api/queue/clear', (req, res) => {
  streamQueue.clear();
  res.json({ success: true, message: '队列已清空' });
});

app.post('/api/queue/add-single', (req, res) => {
  const { gameId } = req.body;
  // 从缓存中找到对应比赛并添加到队列
  // 这里可以实现单个比赛的重新解析
  res.json({ success: true, message: `比赛 ${gameId} 已添加到队列` });
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
  console.log('Received games data from Vercel API');
  const apiKey = req.header('X-Api-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('Invalid API key provided');
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  let body = '';
  req.on('data', function (chunk) {
    body += chunk.toString();
  });

  req.on('end', function () {
    try {
      const gamesData = JSON.parse(body);

      if (!gamesData || !Array.isArray(gamesData)) {
        res.status(400).json({ error: 'Invalid data format - expected array' });
        return;
      }

      // 数据直接存储到KV，不使用本地缓存
      console.log('Received games data:', gamesData.length, 'games');

      res.json({ success: true, count: gamesData.length });
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError.message);
      res.status(400).json({ error: 'Invalid JSON data' });
    }
  });

  req.on('error', function (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Request processing error' });
  });
});

app.post('/fetchGamesData', async (req, res) => {
  console.log('Received games data from Vercel API');
  const apiKey = req.header('X-Api-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('apiKey', apiKey);
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  const gamesData = await fetchGamesData();
  console.log('Fetched games data:', gamesData.length, 'games');
  res.json({ success: true });
});

app.get('/api/getIframeSrc', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: '缺少URL参数' });
    return;
  }

  try {
    const iframeSrc = await getFullIframeSrc(url);
    res.json({ url: iframeSrc });
  } catch (error) {
    console.error('获取iframe地址错误:', error.message);
    res.status(500).json({ error: '获取iframe地址失败' });
  }
});

app.get('/api/getStreamUrl', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: '缺少URL参数' });
    return;
  }

  try {
    const iframeSrc = await getFullIframeSrc(url);
    console.log('获取到iframe地址:', iframeSrc);
    
    // 如果已经是m3u8地址，直接返回
    if (iframeSrc.includes('.m3u8')) {
      console.log('已经是m3u8地址，直接返回');
      res.json({ streamUrl: iframeSrc, originalIframe: iframeSrc });
      return;
    }
    
    // 处理不同格式的iframe地址
    if (iframeSrc.includes('cloud.yumixiu768.com')) {
      // 格式: //cloud.yumixiu768.com/player/pap.html?id=BASE64STRING 或 msss.html?id=/live/xxx.m3u8
      const fullIframeUrl = iframeSrc.startsWith('//') ? 'http:' + iframeSrc : iframeSrc;
      
      // 检查是否是 msss.html 格式，直接提取id参数中的m3u8地址
      if (fullIframeUrl.includes('msss.html')) {
        const urlObj = new URL(fullIframeUrl);
        const id = urlObj.searchParams.get('id');
        if (id && id.includes('.m3u8')) {
          // id参数本身就是m3u8地址
          let m3u8Url = id;
          if (m3u8Url.startsWith('/')) {
            m3u8Url = 'https://hdl7.szsummer.cn' + m3u8Url;
          }
          console.log('从msss.html提取的m3u8地址:', m3u8Url);
          res.json({ streamUrl: m3u8Url, originalIframe: iframeSrc });
          return;
        }
      }
      
      // 需要再次请求这个iframe页面来获取真正的m3u8地址
      try {
        const iframeResponse = await axios.get(fullIframeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'Referer': url
          }
        });
        
        // 从iframe页面中提取m3u8地址
        const m3u8Match = iframeResponse.data.match(/(?:source|src|url|m3u8)['"]?\s*[:=]\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i);
        if (m3u8Match) {
          let m3u8Url = m3u8Match[1];
          if (m3u8Url.startsWith('//')) {
            m3u8Url = 'http:' + m3u8Url;
          }
          res.json({ streamUrl: m3u8Url, originalIframe: iframeSrc });
          return;
        }
      } catch (iframeError) {
        console.error('获取iframe内容失败:', iframeError.message);
      }
    }
    
    // 尝试从原始iframe地址中提取m3u8
    const m3u8Match = iframeSrc.match(/id=([^&]+)/);
    if (m3u8Match) {
      let m3u8Url = decodeURIComponent(m3u8Match[1]);
      
      // 检查是否是Base64编码（pap.html的情况）
      if (iframeSrc.includes('pap.html') && m3u8Url.match(/^[A-Za-z0-9+/]+=*$/)) {
        console.log('检测到Base64编码的ID，需要进一步处理');
        // 对于pap.html，需要请求这个页面来获取真正的流地址
        try {
          const fullPapUrl = iframeSrc.startsWith('//') ? 'http:' + iframeSrc : iframeSrc;
          const papResponse = await axios.get(fullPapUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
              'Referer': url
            }
          });
          
          // 从pap.html页面提取真正的m3u8地址
          const realM3u8Match = papResponse.data.match(/(?:source|src|url|file)['"]?\s*[:=]\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i);
          if (realM3u8Match) {
            let realM3u8Url = realM3u8Match[1];
            if (realM3u8Url.startsWith('//')) {
              realM3u8Url = 'http:' + realM3u8Url;
            }
            res.json({ streamUrl: realM3u8Url, originalIframe: iframeSrc });
            return;
          }
        } catch (papError) {
          console.error('获取pap.html内容失败:', papError.message);
        }
        
        res.json({ error: '无法从pap.html解析流地址', originalIframe: iframeSrc });
        return;
      }
      
      // 正常的m3u8 URL处理
      if (m3u8Url.startsWith('//')) {
        m3u8Url = 'http:' + m3u8Url;
      } else if (m3u8Url.startsWith('/')) {
        m3u8Url = 'http://hdl7.szsummer.cn' + m3u8Url;
      }
      res.json({ streamUrl: m3u8Url, originalIframe: iframeSrc });
    } else {
      res.json({ error: '无法解析流地址', originalIframe: iframeSrc });
    }
  } catch (error) {
    console.error('获取流地址错误:', error.message);
    res.status(500).json({ error: '获取流地址失败' });
  }
});

// M3U8 代理端点，用于绕过CORS和认证问题
app.get('/proxy/m3u8', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: '缺少URL参数' });
    return;
  }

  try {
    // 使用增强版代理模块
    const result = await proxyM3U8(url);
    
    if (result.success) {
      // 设置正确的CORS头
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Content-Type', result.contentType);
      res.header('Cache-Control', 'no-cache');
      
      res.send(result.content);
    } else {
      console.error('代理失败:', result.error);
      res.status(500).json({ 
        error: '无法获取M3U8流', 
        details: result.error,
        status: result.status 
      });
    }
  } catch (error) {
    console.error('代理M3U8错误:', error.message);
    res.status(500).json({ 
      error: '无法获取M3U8流', 
      details: error.message
    });
  }
});

// 新增缓存管理API
app.post('/api/webhook/update', (req, res) => scheduler.handleWebhookUpdate(req, res));
app.get('/api/cache/warmup', (req, res) => scheduler.handleWarmupRequest(req, res));
app.get('/api/cache/status', async (req, res) => {
  try {
    const status = await scheduler.getCacheStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 代理iframe页面，绕过referer限制
app.get('/proxy/iframe', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).send('Missing URL parameter');
    return;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': url.split('/').slice(0, 3).join('/'),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
      timeout: 10000,
    });

    // 设置正确的content-type
    res.set('Content-Type', 'text/html; charset=utf-8');
    
    // 注入base标签来处理相对路径
    const baseUrl = url.split('/').slice(0, 3).join('/');
    let html = response.data;
    
    // 在<head>标签后注入base标签
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head><base href="${baseUrl}/">`);
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html><head><base href="${baseUrl}/"></head>`);
    }

    res.send(html);
  } catch (error) {
    console.error('代理iframe错误:', error.message);
    res.status(500).send('Failed to load iframe content');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});
