const cheerio = require('cheerio');
const puppeteerCore = require('puppeteer-core');

async function fetchHtml(url) {
  let browser = null;
  try {
    const options = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: true,
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    };

    browser = await puppeteerCore.launch(options);
    const page = await browser.newPage();

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

    // 设置页面超时
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const content = await page.content();
    return cheerio.load(content);

  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    console.error(error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close().catch(console.error);
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
