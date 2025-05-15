// 导入node-fetch
const fetch = require('node-fetch');

// Vercel API 路由处理函数
module.exports = async (req, res) => {
  // 只允许POST请求和正确的API密钥
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  try {
    console.log(`[${new Date().toISOString()}] 手动刷新触发`);
    
    // 调用定时刷新接口
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    const cronUrl = `${baseUrl}/api/cron-refresh`;
    
    console.log(`Calling cron refresh at: ${cronUrl}`);
    
    const response = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger refresh: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    return res.status(200).json({
      success: true,
      message: 'Manual refresh triggered successfully',
      result
    });
  } catch (error) {
    console.error('Error triggering manual refresh:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 