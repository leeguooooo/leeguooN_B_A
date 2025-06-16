// 增强版解析直播链接 API - 多策略组合
const axios = require('axios');
const cheerio = require('cheerio');

// 代理池（示例，实际使用时需要有效代理）
const PROXY_POOL = [
  // 'http://proxy1.com:8080',
  // 'http://proxy2.com:8080',
];

// User-Agent 池
const USER_AGENTS = {
  mobile: [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
  ],
  desktop: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ]
};

// 获取随机元素
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 策略1：基础请求
async function fetchWithBasic(url, source) {
  const isMobile = url.includes('/m.') || url.includes('//m.');
  const userAgent = getRandomItem(isMobile ? USER_AGENTS.mobile : USER_AGENTS.desktop);
  
  return axios.get(url, {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': source || url.split('/').slice(0, 3).join('/')
    },
    timeout: 10000
  });
}

// 策略2：模拟真实浏览器行为
async function fetchWithRealBrowser(url, source) {
  const isMobile = url.includes('/m.') || url.includes('//m.');
  const userAgent = getRandomItem(isMobile ? USER_AGENTS.mobile : USER_AGENTS.desktop);
  
  // 添加更多真实浏览器的请求头
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': isMobile ? '"Android"' : '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Referer': source || url.split('/').slice(0, 3).join('/')
  };
  
  return axios.get(url, {
    headers,
    timeout: 15000,
    maxRedirects: 5,
    // 允许不安全的 SSL（某些网站证书有问题）
    httpsAgent: new (require('https').Agent)({
      rejectUnauthorized: false
    })
  });
}

// 策略3：使用代理（如果有的话）
async function fetchWithProxy(url, source, proxy) {
  const userAgent = getRandomItem(USER_AGENTS.mobile);
  
  const config = {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': source || url.split('/').slice(0, 3).join('/')
    },
    timeout: 20000
  };
  
  if (proxy) {
    const proxyUrl = new URL(proxy);
    config.proxy = {
      host: proxyUrl.hostname,
      port: proxyUrl.port,
      protocol: proxyUrl.protocol
    };
  }
  
  return axios.get(url, config);
}

// 主函数：尝试多种策略
async function fetchHtmlWithStrategies(url, source) {
  const strategies = [
    { name: 'basic', fn: () => fetchWithBasic(url, source) },
    { name: 'real-browser', fn: () => fetchWithRealBrowser(url, source) },
  ];
  
  // 如果有代理，添加代理策略
  if (PROXY_POOL.length > 0) {
    const proxy = getRandomItem(PROXY_POOL);
    strategies.push({
      name: `proxy-${proxy}`,
      fn: () => fetchWithProxy(url, source, proxy)
    });
  }
  
  let lastError;
  
  for (const strategy of strategies) {
    try {
      console.log(`[Strategy] Trying ${strategy.name}...`);
      const response = await strategy.fn();
      console.log(`[Strategy] ${strategy.name} succeeded! Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`[Strategy] ${strategy.name} failed:`, error.message);
      lastError = error;
      
      // 延迟后再试下一个策略
      if (strategies.indexOf(strategy) < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  const source = req.query.source || '';
  const host = url.split('/').slice(0, 3).join('/');

  try {
    console.log('[API] Enhanced parsing for:', url);
    
    // 使用多策略获取页面
    const html = await fetchHtmlWithStrategies(url, source);
    
    // 解析 HTML
    const $ = cheerio.load(html);
    
    // 尝试多种选择器（适应不同页面结构）
    const selectors = [
      '.sub_channel a.item',
      '.channel a[data-play]',
      'a.play-link',
      'a[href*="play"]'
    ];
    
    let liveLinks = [];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`[API] Found ${elements.length} elements with selector: ${selector}`);
        
        elements.each((i, el) => {
          const element = $(el);
          const name = element.text().trim() || `频道${i + 1}`;
          const urlPath = element.attr('data-play') || element.attr('href');
          
          if (urlPath && !urlPath.startsWith('#')) {
            const fullUrl = urlPath.startsWith('http') ? urlPath : `${host}${urlPath}`;
            liveLinks.push({ name, url: fullUrl });
          }
        });
        
        if (liveLinks.length > 0) break;
      }
    }
    
    console.log(`[API] Found ${liveLinks.length} live links`);
    
    // 设置缓存
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    return res.status(200).json(liveLinks);
    
  } catch (error) {
    console.error('[API] Enhanced parsing failed:', error.message);
    
    // 智能错误处理
    const errorResponse = {
      error: 'Failed to parse live links',
      message: error.message,
      url: url,
      timestamp: new Date().toISOString(),
      liveLinks: []
    };
    
    if (error.response) {
      errorResponse.errorCode = error.response.status;
      errorResponse.errorType = error.response.status === 403 ? 'ACCESS_DENIED' : 
                               error.response.status === 404 ? 'NOT_FOUND' : 
                               'HTTP_ERROR';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorResponse.errorCode = 408;
      errorResponse.errorType = 'TIMEOUT';
    } else {
      errorResponse.errorCode = 500;
      errorResponse.errorType = 'INTERNAL_ERROR';
    }
    
    return res.status(200).json(errorResponse);
  }
};

module.exports.config = {
  maxDuration: 30
};