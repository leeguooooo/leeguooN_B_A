const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHtml(url) {
  try {
    const response = await axios.get(url);
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}

async function getDynamicContent(url) {
  try {
    // 构建更完整的浏览器头信息来绕过反爬虫检测
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Referer': url.includes('/play/sm.html') ? `${baseUrl}/` : `${baseUrl}/play/sm.html?id=265&id2=`,
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting dynamic content:', error.message);
    if (error.code === 'ETIMEDOUT') {
      throw new Error('请求超时，可能是网络问题或网站访问限制');
    }
    throw error;
  }
}

module.exports = {
  fetchHtml,
  getDynamicContent,
};
