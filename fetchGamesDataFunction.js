const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const axios = require('axios');

async function fetchWithAxios(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000,
      maxRedirects: 5
    });
    return response.data;
  } catch (error) {
    console.error('Axios fetch failed:', error.message);
    throw error;
  }
}

async function fetchHtml(url) {
  let browser = null;
  try {
    // 首先尝试使用 axios
    try {
      console.log('Attempting to fetch with Axios...');
      const content = await fetchWithAxios(url);
      return cheerio.load(content);
    } catch (axiosError) {
      console.log('Axios failed, falling back to Puppeteer...');
    }

    // 如果 axios 失败，使用 Puppeteer
    const options = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080'
      ],
      headless: 'new',
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      timeout: 30000
    };

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // 设置请求头
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0'
    });

    // 设置请求拦截
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (
        req.resourceType() == 'stylesheet' ||
        req.resourceType() == 'font' ||
        req.resourceType() == 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 处理对话框
    page.on('dialog', async dialog => {
      console.log(`Closing dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    // 添加超时和重试机制
    let retries = 3;
    let content = null;
    
    while (retries > 0 && !content) {
      try {
        await page.setDefaultNavigationTimeout(30000);
        await page.goto(url, { 
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 30000 
        });
        
        await page.waitForSelector('body');
        content = await page.content();
        
      } catch (error) {
        console.error(`Attempt ${4 - retries} failed:`, error.message);
        retries--;
        if (retries > 0) {
          console.log(`Retrying... ${retries} attempts remaining`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!content) {
      throw new Error('Failed to fetch content after all retries');
    }

    return cheerio.load(content);

  } catch (error) {
    console.error('Error fetching URL:', url);
    console.error(error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function fetchGamesData() {
  console.log('Fetching games data...');
  try {
    const $ = await fetchHtml('http://www.jrskan.com/');

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

    // Update the cache with the new data and timestamp
    // cachedData.games = games;
    // cachedData.timestamp = new Date().getTime();
    return games;
  } catch (error) {
    console.error(error);
  }
}

module.exports = fetchGamesData;
