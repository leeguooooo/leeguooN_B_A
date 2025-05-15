const cheerio = require('cheerio');
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;
const fs = require('fs');
const path = require('path');

// 设置页面请求超时时间（毫秒）
const PAGE_TIMEOUT = 30000;
// 设置页面请求重试次数
const MAX_RETRIES = 2;
// 发布页地址
const PUBLISH_PAGE_URL = 'https://www.qiumi1314.com/';
// 缓存有效期（毫秒）- 1天
const URL_CACHE_DURATION = 24 * 60 * 60 * 1000;
// 缓存文件路径（仅在非Vercel环境使用）
const URL_CACHE_FILE = path.join(__dirname, '.url_cache.json');

// URL内存缓存 - 用于Vercel环境
let memoryCache = {
  url: null,
  timestamp: null
};

// 从缓存获取URL
function getCachedUrl() {
  const isVercel = process.env.VERCEL === '1';
  
  // 优先检查环境变量缓存 (适用于Vercel)
  if (process.env.CACHED_URL && process.env.CACHED_TIMESTAMP) {
    const timestamp = parseInt(process.env.CACHED_TIMESTAMP, 10);
    if (!isNaN(timestamp) && (Date.now() - timestamp < URL_CACHE_DURATION)) {
      console.log(`Using env cached URL: ${process.env.CACHED_URL} (cached at ${new Date(timestamp).toLocaleString()})`);
      return process.env.CACHED_URL;
    }
  }
  
  // 检查内存缓存
  if (memoryCache.url && memoryCache.timestamp && (Date.now() - memoryCache.timestamp < URL_CACHE_DURATION)) {
    console.log(`Using memory cached URL: ${memoryCache.url} (cached at ${new Date(memoryCache.timestamp).toLocaleString()})`);
    return memoryCache.url;
  }
  
  // 在非Vercel环境中，检查文件缓存
  if (!isVercel) {
    try {
      if (fs.existsSync(URL_CACHE_FILE)) {
        const cacheData = JSON.parse(fs.readFileSync(URL_CACHE_FILE, 'utf8'));
        // 检查缓存是否过期
        if (cacheData.timestamp && (Date.now() - cacheData.timestamp < URL_CACHE_DURATION)) {
          console.log(`Using file cached URL: ${cacheData.url} (cached at ${new Date(cacheData.timestamp).toLocaleString()})`);
          // 更新内存缓存
          memoryCache = cacheData;
          return cacheData.url;
        }
      }
    } catch (error) {
      console.error('Error reading URL cache file:', error.message);
    }
  }
  
  return null;
}

// 保存URL到缓存
function saveUrlToCache(url) {
  const now = Date.now();
  const isVercel = process.env.VERCEL === '1';
  
  // 更新内存缓存
  memoryCache = {
    url,
    timestamp: now
  };
  
  console.log(`Saved URL to memory cache: ${url}`);
  
  // 尝试设置环境变量 (仅日志记录，实际上无法在运行时修改环境变量)
  if (isVercel) {
    console.log(`[Note] On Vercel, URL '${url}' should be set as CACHED_URL env var`);
    console.log(`[Note] And timestamp '${now}' should be set as CACHED_TIMESTAMP env var`);
    
    // 在生产环境中，您需要通过 Vercel Dashboard 或 CLI 更新环境变量
    // 这里只是记录需要更新的值，实际运行中无法动态更新环境变量
  } else {
    // 在非Vercel环境，保存到文件
    try {
      const cacheData = { url, timestamp: now };
      fs.writeFileSync(URL_CACHE_FILE, JSON.stringify(cacheData), 'utf8');
      console.log(`Saved URL to file cache: ${url}`);
    } catch (error) {
      console.error('Error saving URL to cache file:', error.message);
    }
  }
}

// 从发布页获取最新可用网址
async function getLatestUrl() {
  console.log('Checking for cached URL...');
  const cachedUrl = getCachedUrl();
  if (cachedUrl) {
    return cachedUrl;
  }
  
  console.log('No valid cached URL found, fetching from publish page...');
  let browser = null;
  
  try {
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    const executablePath =
      isVercel || isProduction
        ? await chromium.executablePath
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        
    browser = await puppeteer.launch({
      executablePath: executablePath,
      args: [
        ...chromium.args, 
        '--hide-scrollbars', 
        '--disable-web-security',
        '--disable-dev-shm-usage', 
        '--disable-infobars',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-features=site-per-process',
        '--disable-extensions',
        '--disable-gpu'
      ],
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', req => {
      const resourceType = req.resourceType();
      if (
        resourceType === 'stylesheet' ||
        resourceType === 'font' ||
        resourceType === 'image' ||
        resourceType === 'media' ||
        resourceType === 'other' ||
        resourceType === 'ping'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 添加自动关闭对话框
    page.on('dialog', async dialog => {
      console.log(`Closing dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.goto(PUBLISH_PAGE_URL, { 
      timeout: PAGE_TIMEOUT,
      waitUntil: 'domcontentloaded'
    });

    // 等待页面内容加载
    await page.waitForSelector('ul, li a, a', { timeout: PAGE_TIMEOUT });
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // 关闭浏览器
    await browser.close();
    browser = null;
    
    // 查找页面上标记为最近更新的链接
    let latestUrl = null;
    
    // 查找格式类似 www.jrskan.com 或 jrskan.com 的URL
    // 优先获取更新时间最新的链接
    const recentDateTexts = $('body').text().match(/\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/g);
    if (recentDateTexts && recentDateTexts.length > 0) {
      // 排序日期，最近的日期优先
      const sortedDates = [...recentDateTexts].sort((a, b) => {
        return new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-'));
      });
      
      // 查找包含最近日期附近的链接
      for (const dateText of sortedDates) {
        const dateArea = $(`*:contains("${dateText}")`).first().parent();
        const links = dateArea.find('a[href]');
        if (links.length === 0) {
          // 如果没有找到链接，尝试寻找文本中的域名
          const potentialUrls = dateArea.text().match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.)*jrs[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net)/g);
          if (potentialUrls && potentialUrls.length > 0) {
            latestUrl = `http://${potentialUrls[0]}`;
            break;
          }
        } else {
          latestUrl = links.first().attr('href');
          if (latestUrl) break;
        }
      }
    }
    
    // 如果没找到更新日期，找所有可能的域名
    if (!latestUrl) {
      // 查找页面上所有 a 标签中包含 jrs 的链接
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('jrs') && (href.includes('.com') || href.includes('.net'))) {
          latestUrl = href;
          return false; // 找到一个就跳出
        }
      });
      
      // 如果还没找到，尝试从文本中提取
      if (!latestUrl) {
        const potentialUrls = $('body').text().match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.)*jrs[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net)/g);
        if (potentialUrls && potentialUrls.length > 0) {
          latestUrl = `http://${potentialUrls[0]}`;
        }
      }
    }
    
    // 确保URL格式正确
    if (latestUrl) {
      if (!latestUrl.startsWith('http')) {
        latestUrl = `http://${latestUrl}`;
      }
      console.log(`Found latest URL: ${latestUrl}`);
      // 保存到缓存
      saveUrlToCache(latestUrl);
      return latestUrl;
    }
    
    // 如果所有方法都失败，返回默认URL
    const defaultUrl = 'http://www.jrskan.com/';
    console.log(`Could not find a valid URL, using default: ${defaultUrl}`);
    saveUrlToCache(defaultUrl);
    return defaultUrl;
    
  } catch (error) {
    console.error('Error fetching latest URL:', error.message);
    
    // 关闭浏览器以防内存泄漏
    if (browser) {
      await browser.close();
    }
    
    // 如果出错，返回默认URL
    const defaultUrl = 'http://www.jrskan.com/';
    console.log(`Error occurred, using default URL: ${defaultUrl}`);
    saveUrlToCache(defaultUrl);
    return defaultUrl;
  }
}

async function fetchHtml(url, retryCount = 0) {
  let browser = null;
  
  try {
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    const executablePath =
      isVercel || isProduction
        ? await chromium.executablePath
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        
    browser = await puppeteer.launch({
      executablePath: executablePath,
      args: [
        ...chromium.args, 
        '--hide-scrollbars', 
        '--disable-web-security',
        '--disable-dev-shm-usage', // 减少内存使用
        '--disable-infobars',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-features=site-per-process', // 提高性能
        '--disable-extensions',
        '--disable-gpu'
      ],
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // 设置请求拦截，阻止不必要的资源
    await page.setRequestInterception(true);
    page.on('request', req => {
      const resourceType = req.resourceType();
      if (
        resourceType === 'stylesheet' ||
        resourceType === 'font' ||
        resourceType === 'image' ||
        resourceType === 'media' ||
        resourceType === 'other' ||
        resourceType === 'ping'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 设置自动关闭对话框
    page.on('dialog', async dialog => {
      console.log(`Closing dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    // 设置页面超时
    console.log(`Fetching HTML from: ${url}`);
    await page.goto(url, { 
      timeout: PAGE_TIMEOUT,
      waitUntil: 'domcontentloaded' // 只等待DOM内容加载，不等待图片等资源
    });

    // 等待主要内容加载
    try {
      await page.waitForSelector('div.loc_match_list', { timeout: PAGE_TIMEOUT });
    } catch (error) {
      console.error(`Error waiting for match list: ${error.message}`);
      console.log('URL may be invalid, retrying...');
      
      // 关闭浏览器
      await browser.close();
      browser = null;
      
      // 如果找不到比赛列表，说明URL可能无效，清除缓存并重试
      if (retryCount === 0) {
        console.log('Clearing URL cache and fetching new URL...');
        memoryCache = { url: null, timestamp: null };
        
        // 获取新的URL
        const newUrl = await getLatestUrl();
        return fetchHtml(newUrl, retryCount + 1);
      }
      
      throw error;
    }

    const content = await page.content();
    await browser.close();
    browser = null;

    return cheerio.load(content);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`, error.message);
    
    // 关闭浏览器以防内存泄漏
    if (browser) {
      await browser.close();
      browser = null;
    }
    
    // 重试机制
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      return fetchHtml(url, retryCount + 1);
    }
    
    throw error;
  }
}

async function fetchGamesData() {
  console.log('Fetching games data...');
  const startTime = Date.now();
  
  try {
    // 获取最新的网址
    const latestUrl = await getLatestUrl();
    console.log(`Using URL: ${latestUrl}`);
    
    // 使用获取到的网址爬取数据
    const $ = await fetchHtml(latestUrl);
    const matchList = $('div.loc_match_list');
    const matches = matchList.find('ul.item.play');
    const games = [];

    matches.each((index, element) => {
      const match = $(element);

      const league = match.find('li.lab_events span.name').text().trim();
      const gameTime = match.find('li.lab_time').text().trim();

      const team1 = match.find('li.lab_team_home strong.name').text().trim();
      const team1Score = match.find('li.lab_team_home em.bf').text().trim();
      const team1Logo = match
        .find('li.lab_team_home span.avatar img')
        .attr('src');

      const team2 = match.find('li.lab_team_away strong.name').text().trim();
      const team2Score = match.find('li.lab_team_away em.bf').text().trim();
      const team2Logo = match
        .find('li.lab_team_away span.avatar img')
        .attr('src');

      const liveLinksElements = match.find('li.lab_channel a.item');
      const liveLinks = [];

      liveLinksElements.each((i, el) => {
        const liveLinkElement = $(el);
        const liveLinkURL = liveLinkElement.attr('href');
        const liveLinkName = liveLinkElement.text();
        liveLinks.push({ name: liveLinkName, url: liveLinkURL });
      });

      const game = {
        league,
        gameTime,
        team1,
        team1Score,
        team1Logo,
        team2,
        team2Score,
        team2Logo,
        liveLinks,
      };

      games.push(game);
    });

    const duration = Date.now() - startTime;
    console.log(`Fetched ${games.length} games in ${duration}ms`);
    
    return games;
  } catch (error) {
    console.error('Error in fetchGamesData:', error.message);
    return null;
  }
}

module.exports = fetchGamesData;
