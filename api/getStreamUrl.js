// 获取最终流地址 API
const getFullIframeSrc = require('../decode_url.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: '缺少URL参数' });
  }

  // 获取源网站参数
  const source = req.query.source || '';

  try {
    console.log('[API] Getting stream URL from:', url);
    
    const iframeSrc = await getFullIframeSrc(url);
    console.log('[API] Got iframe src:', iframeSrc);
    
    // 如果已经是m3u8地址，直接返回
    if (iframeSrc.includes('.m3u8')) {
      console.log('[API] Already m3u8 URL, returning directly');
      return res.status(200).json({ 
        streamUrl: iframeSrc, 
        originalIframe: iframeSrc 
      });
    }
    
    // 处理不同格式的iframe地址
    if (iframeSrc.includes('cloud.yumixiu768.com')) {
      const fullIframeUrl = iframeSrc.startsWith('//') ? 'https:' + iframeSrc : iframeSrc;
      
      // 检查是否是 msss.html 格式
      if (fullIframeUrl.includes('msss.html')) {
        const urlObj = new URL(fullIframeUrl);
        const id = urlObj.searchParams.get('id');
        if (id && id.includes('.m3u8')) {
          let m3u8Url = id;
          if (m3u8Url.startsWith('/')) {
            m3u8Url = 'https://hdl7.szsummer.cn' + m3u8Url;
          }
          console.log('[API] Extracted m3u8 from msss.html:', m3u8Url);
          return res.status(200).json({ 
            streamUrl: m3u8Url, 
            originalIframe: iframeSrc 
          });
        }
      }
      
      // 请求iframe页面获取m3u8地址
      try {
        // 使用传入的 source 作为 referer
        let referer = source || 'https://www.jrs16.com/';
        
        // 确保 referer 是完整的 URL
        if (referer && !referer.startsWith('http')) {
          referer = 'https://' + referer;
        }
        
        const iframeResponse = await fetch(fullIframeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': referer,
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site'
          }
        });
        
        if (!iframeResponse.ok) {
          throw new Error(`HTTP error! status: ${iframeResponse.status}`);
        }
        
        const iframeHtml = await iframeResponse.text();
        
        // 从响应中提取m3u8地址
        const m3u8Match = iframeHtml.match(/(?:source|src|url|m3u8)['"]?\s*[:=]\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i);
        if (m3u8Match) {
          let m3u8Url = m3u8Match[1];
          if (m3u8Url.startsWith('//')) {
            m3u8Url = 'https:' + m3u8Url;
          } else if (m3u8Url.startsWith('/')) {
            const iframeHost = new URL(fullIframeUrl).origin;
            m3u8Url = iframeHost + m3u8Url;
          }
          
          console.log('[API] Extracted m3u8 from iframe:', m3u8Url);
          return res.status(200).json({ 
            streamUrl: m3u8Url, 
            originalIframe: iframeSrc 
          });
        }
      } catch (iframeError) {
        console.error('[API] Failed to fetch iframe content:', iframeError.message);
      }
    }
    
    // 尝试从iframe URL参数中提取
    try {
      const urlObj = new URL(iframeSrc);
      const id = urlObj.searchParams.get('id') || urlObj.searchParams.get('url');
      
      if (id) {
        let streamUrl = decodeURIComponent(id);
        
        // Base64 解码
        if (streamUrl.match(/^[A-Za-z0-9+/]+=*$/)) {
          try {
            streamUrl = Buffer.from(streamUrl, 'base64').toString('utf-8');
          } catch (e) {
            console.log('[API] Not a valid base64 string');
          }
        }
        
        // 确保是完整URL
        if (streamUrl.includes('.m3u8')) {
          if (streamUrl.startsWith('//')) {
            streamUrl = 'https:' + streamUrl;
          } else if (streamUrl.startsWith('/')) {
            const host = new URL(iframeSrc).origin;
            streamUrl = host + streamUrl;
          }
          
          console.log('[API] Extracted stream URL from params:', streamUrl);
          return res.status(200).json({ 
            streamUrl: streamUrl, 
            originalIframe: iframeSrc 
          });
        }
      }
    } catch (e) {
      console.log('[API] Failed to parse URL:', e.message);
    }
    
    // 如果都失败了，返回原始iframe地址
    console.log('[API] No m3u8 found, returning iframe URL');
    return res.status(200).json({ 
      streamUrl: iframeSrc, 
      originalIframe: iframeSrc,
      warning: 'Could not extract m3u8 URL, returning iframe URL' 
    });
    
  } catch (error) {
    console.error('[API] Error getting stream URL:', error.message);
    
    // 返回详细的错误信息
    let statusCode = 500;
    let errorResponse = {
      error: '获取流地址失败',
      message: error.message,
      url: url,
      timestamp: new Date().toISOString()
    };
    
    // 特殊处理不同类型的错误
    if (error.message.includes('403')) {
      statusCode = 200;
      errorResponse.errorCode = 403;
      errorResponse.errorType = 'ACCESS_DENIED';
      errorResponse.suggestion = '目标网站拒绝访问，可能需要更新请求头或使用代理';
      errorResponse.streamUrl = null;
    } else if (error.message.includes('404')) {
      statusCode = 200;
      errorResponse.errorCode = 404;
      errorResponse.errorType = 'NOT_FOUND';
      errorResponse.suggestion = '流地址页面不存在，可能已失效';
      errorResponse.streamUrl = null;
    } else if (error.message.includes('timeout')) {
      statusCode = 200;
      errorResponse.errorCode = 408;
      errorResponse.errorType = 'TIMEOUT';
      errorResponse.suggestion = '请求超时，目标服务器响应过慢';
      errorResponse.streamUrl = null;
    } else {
      errorResponse.errorCode = 500;
      errorResponse.errorType = 'INTERNAL_ERROR';
      errorResponse.suggestion = '内部错误，请稍后重试';
    }
    
    return res.status(statusCode).json(errorResponse);
  }
}

module.exports.config = {
  maxDuration: 30
};