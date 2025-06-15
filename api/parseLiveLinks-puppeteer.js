// 使用 Puppeteer 解析直播链接 API
const puppeteer = require('puppeteer');

// 仅在 Vercel 环境中使用 @sparticuz/chromium
let chromium;
if (process.env.VERCEL) {
  chromium = require('@sparticuz/chromium');
}

async function fetchHtmlWithPuppeteer(url, source) {
  let browser;
  
  try {
    const options = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080'
      ],
      headless: 'new',
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      timeout: 30000
    };

    // Vercel 环境需要特殊配置
    if (process.env.VERCEL && chromium) {
      options.args = [...chromium.args, ...options.args];
      options.executablePath = await chromium.executablePath();
      options.headless = chromium.headless;
    }

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // 设置 User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 设置额外的请求头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Referer': source || 'https://m.jrs03.com'
    });

    // 设置请求拦截，屏蔽不必要的资源
    await page.setRequestInterception(true);
    page.on('request', req => {
      const resourceType = req.resourceType();
      if (['stylesheet', 'font', 'image', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log('[Puppeteer] Navigating to:', url);
    
    // 访问页面
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // 等待关键元素加载
    try {
      await page.waitForSelector('.sub_channel', { timeout: 5000 });
    } catch (e) {
      console.log('[Puppeteer] sub_channel not found, continuing...');
    }

    // 获取页面内容
    const content = await page.content();
    await browser.close();
    
    return content;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
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
    console.log('[API] Parsing live links with Puppeteer from:', url);
    
    // 使用 Puppeteer 获取页面内容
    const html = await fetchHtmlWithPuppeteer(url, source);
    
    // 使用正则表达式解析（避免依赖 cheerio）
    const linkRegex = /<a[^>]+class=['"]item['"][^>]+data-play=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/g;
    const liveLinks = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const urlPath = match[1];
      const name = match[2].trim();
      
      if (name && urlPath) {
        const fullUrl = urlPath.startsWith('http') ? urlPath : `${host}${urlPath}`;
        liveLinks.push({ name, url: fullUrl });
      }
    }

    console.log(`[API] Found ${liveLinks.length} live links`);
    
    // 设置缓存
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    return res.status(200).json(liveLinks);
  } catch (error) {
    console.error('[API] Error with Puppeteer:', error.message);
    
    // 返回错误信息
    let errorResponse = {
      error: 'Failed to parse live links',
      message: error.message,
      url: url,
      timestamp: new Date().toISOString()
    };
    
    if (error.message.includes('403')) {
      errorResponse.errorCode = 403;
      errorResponse.errorType = 'ACCESS_DENIED';
      errorResponse.suggestion = 'Even Puppeteer is blocked. The site has strong protection.';
      errorResponse.liveLinks = [];
    } else if (error.message.includes('timeout')) {
      errorResponse.errorCode = 408;
      errorResponse.errorType = 'TIMEOUT';
      errorResponse.suggestion = 'Page loading timeout. Puppeteer took too long.';
      errorResponse.liveLinks = [];
    } else {
      errorResponse.errorCode = 500;
      errorResponse.errorType = 'INTERNAL_ERROR';
      errorResponse.liveLinks = [];
    }
    
    return res.status(200).json(errorResponse);
  }
}

module.exports.config = {
  maxDuration: 30
};