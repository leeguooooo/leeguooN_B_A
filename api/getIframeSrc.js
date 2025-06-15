// 获取 iframe 源地址 API
const getFullIframeSrc = require('../decode_url.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: '缺少URL参数' });
  }

  try {
    console.log('[API] Getting iframe src from:', url);
    
    const iframeSrc = await getFullIframeSrc(url);
    
    console.log('[API] Got iframe src:', iframeSrc);
    
    // 设置缓存
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    return res.status(200).json({ url: iframeSrc });
  } catch (error) {
    console.error('[API] 获取iframe地址错误:', error.message);
    return res.status(500).json({ 
      error: '获取iframe地址失败',
      message: error.message 
    });
  }
}

export const config = {
  maxDuration: 30
};