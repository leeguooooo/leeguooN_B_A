const cheerio = require('cheerio');
const chromium = require('chrome-aws-lambda');
const puppeteerCore = require('puppeteer-core');

async function fetchHtml(url) {
  try {
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';

    // 配置浏览器选项
    const options = {
      args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
      defaultViewport: isVercel ? chromium.defaultViewport : {
        width: 1920,
        height: 1080
      },
      executablePath: isVercel 
        ? await chromium.executablePath
        : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: isVercel ? chromium.headless : true
    };

    // 在 Vercel 环境使用 chrome-aws-lambda，在本地使用 puppeteer-core
    const browser = await puppeteerCore.launch(options);

    const page = await browser.newPage();
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

    page.on('dialog', async dialog => {
      console.log(`Closing dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const content = await page.content();
    await browser.close();

    return cheerio.load(content);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
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
