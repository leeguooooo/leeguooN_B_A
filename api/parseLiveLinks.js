// 解析直播链接 API
const cheerio = require('cheerio');

async function fetchHtml(url, source) {
  try {
    // 如果传入了 source，使用它作为 referer
    // 否则根据 URL 判断来源网站
    let referer = source || 'https://www.jrs16.com/';
    
    // 确保 referer 是完整的 URL
    if (referer && !referer.startsWith('http')) {
      referer = 'https://' + referer;
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Referer': referer,
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    return cheerio.load(html);
  } catch (error) {
    console.error('Error fetching HTML:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  // 获取源网站参数
  const source = req.query.source || '';
  const host = url.split('/').slice(0, 3).join('/');

  try {
    console.log('[API] Parsing live links from:', url);
    
    // 尝试多种方法获取内容
    let $;
    let method = 'direct';
    
    try {
      // 方法1：直接获取
      $ = await fetchHtml(url, source);
    } catch (directError) {
      console.log('[API] Direct fetch failed:', directError.message);
      
      // 方法2：尝试使用移动端 User-Agent
      if (directError.message.includes('403')) {
        try {
          method = 'mobile';
          const mobileResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'zh-CN,zh;q=0.9',
            }
          });
          
          if (!mobileResponse.ok) {
            throw new Error(`HTTP error! status: ${mobileResponse.status}`);
          }
          
          const html = await mobileResponse.text();
          $ = cheerio.load(html);
        } catch (mobileError) {
          console.log('[API] Mobile UA failed:', mobileError.message);
          throw directError; // 抛出原始错误
        }
      } else {
        throw directError;
      }
    }
    
    console.log(`[API] Successfully fetched using ${method} method`);
    
    const subChannels = $('.sub_channel a.item');
    const liveLinks = [];

    subChannels.each((i, el) => {
      const subChannel = $(el);
      const name = subChannel.text().trim();
      const urlPath = subChannel.attr('data-play');
      
      if (name && urlPath) {
        const fullUrl = urlPath.startsWith('http') ? urlPath : `${host}${urlPath}`;
        liveLinks.push({ name, url: fullUrl });
      }
    });

    console.log(`[API] Found ${liveLinks.length} live links`);
    
    // 设置缓存
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    return res.status(200).json(liveLinks);
  } catch (error) {
    console.error('[API] Error parsing live links:', error.message);
    
    // 根据错误类型返回更详细的信息
    let statusCode = 500;
    let errorResponse = {
      error: 'Failed to parse live links',
      message: error.message,
      url: url,
      timestamp: new Date().toISOString()
    };
    
    // 特殊处理 403 错误
    if (error.message.includes('403')) {
      statusCode = 200; // 返回 200 但标记错误
      errorResponse.errorCode = 403;
      errorResponse.errorType = 'ACCESS_DENIED';
      errorResponse.suggestion = 'The target website is blocking our requests. This may be due to anti-bot protection.';
      errorResponse.liveLinks = []; // 返回空数组而不是错误
    } else if (error.message.includes('404')) {
      statusCode = 200;
      errorResponse.errorCode = 404;
      errorResponse.errorType = 'NOT_FOUND';
      errorResponse.suggestion = 'The requested game page was not found.';
      errorResponse.liveLinks = [];
    } else if (error.message.includes('timeout')) {
      statusCode = 200;
      errorResponse.errorCode = 408;
      errorResponse.errorType = 'TIMEOUT';
      errorResponse.suggestion = 'Request timed out. The target server may be slow or unreachable.';
      errorResponse.liveLinks = [];
    } else {
      // 其他错误保持 500 状态码
      errorResponse.errorCode = 500;
      errorResponse.errorType = 'INTERNAL_ERROR';
    }
    
    return res.status(statusCode).json(errorResponse);
  }
}

export const config = {
  maxDuration: 30
};