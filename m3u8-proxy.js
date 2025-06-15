const axios = require('axios');
const https = require('https');

// 创建自定义的axios实例，忽略SSL证书验证
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function proxyM3U8(url) {
  try {
    console.log('代理M3U8请求:', url);
    
    // 解析URL以获取主机信息
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    // 构建更完整的请求头
    const headers = {
      'Host': urlObj.host,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'http://cloud.yumixiu768.com',
      'Referer': 'http://cloud.yumixiu768.com/',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // 如果URL包含认证参数，保留它们
    if (url.includes('auth_key')) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    
    const response = await axios.get(url, {
      headers: headers,
      timeout: 15000,
      maxRedirects: 5,
      httpsAgent: httpsAgent,
      validateStatus: function (status) {
        return status < 500;
      },
      responseType: 'text'
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', response.headers);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let content = response.data;
    
    // 如果是m3u8文件，处理相对路径
    if (typeof content === 'string' && content.includes('#EXTM3U')) {
      // 将相对路径转换为绝对路径
      const lines = content.split('\n');
      const processedLines = lines.map(line => {
        if (line && !line.startsWith('#') && !line.startsWith('http')) {
          // 这是一个相对路径的片段
          if (line.startsWith('/')) {
            return baseUrl + line;
          } else {
            return url.substring(0, url.lastIndexOf('/') + 1) + line;
          }
        }
        return line;
      });
      content = processedLines.join('\n');
    }
    
    return {
      success: true,
      content: content,
      contentType: response.headers['content-type'] || 'application/vnd.apple.mpegurl'
    };
    
  } catch (error) {
    console.error('M3U8代理错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

module.exports = proxyM3U8;