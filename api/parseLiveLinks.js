// 解析直播链接 API
const cheerio = require('cheerio');

async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
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

  const host = url.split('/').slice(0, 3).join('/');

  try {
    console.log('[API] Parsing live links from:', url);
    
    const $ = await fetchHtml(url);
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
    return res.status(500).json({ 
      error: 'Failed to parse live links',
      message: error.message 
    });
  }
}

export const config = {
  maxDuration: 30
};