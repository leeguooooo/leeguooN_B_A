// 代理解析 API - 通过另一种方式获取内容
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;
  const source = req.query.source || 'https://m.jrs03.com';
  
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    console.log('[Proxy] Fetching content from:', url);
    
    // 使用 edge runtime 的 fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': source
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 简单的正则提取直播链接
    const links = [];
    const linkRegex = /<a[^>]+class=['"]item['"][^>]+data-play=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/g;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const urlPath = match[1];
      const name = match[2].trim();
      if (name && urlPath) {
        const host = url.split('/').slice(0, 3).join('/');
        const fullUrl = urlPath.startsWith('http') ? urlPath : `${host}${urlPath}`;
        links.push({ name, url: fullUrl });
      }
    }
    
    console.log(`[Proxy] Found ${links.length} links`);
    
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(links);
    
  } catch (error) {
    console.error('[Proxy] Error:', error.message);
    return res.status(200).json({
      error: 'Failed to parse links',
      message: error.message,
      errorCode: 403,
      liveLinks: []
    });
  }
}

module.exports.config = {
  runtime: 'edge',
  maxDuration: 30
};