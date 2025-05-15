const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

async function getBrowser() {
  // 检查是否在Vercel环境中
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
  
  if (isVercel) {
    console.log('在Vercel环境中使用@sparticuz/chromium');
    try {
      const browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
      return browser;
    } catch (error) {
      console.error('Vercel环境启动浏览器失败:', error);
      throw error;
    }
  } else {
    // 本地开发环境
    console.log('在本地开发环境中启动浏览器');
    
    try {
      // 尝试使用完整的puppeteer包，更容易在本地工作
      // 需要在package.json的devDependencies中添加
      const puppeteer = require('puppeteer');
      console.log('使用本地puppeteer启动');
      
      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      return browser;
    } catch (error) {
      console.error('本地puppeteer启动失败，尝试备用方案:', error.message);
      
      try {
        // 使用默认chrome路径
        const executablePath = process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome';
            
        console.log(`尝试使用${executablePath}启动`);
            
        return await puppeteerCore.launch({
          headless: "new",
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ],
          executablePath: process.env.CHROME_PATH || executablePath
        });
      } catch (finalError) {
        console.error('所有浏览器启动方式均失败:', finalError);
        throw finalError;
      }
    }
  }
}

module.exports = { getBrowser }; 