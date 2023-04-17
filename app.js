const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;


async function fetchHtml2(url) {
  try {
    const response = await axios.get(url);
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}


async function fetchHtml(url) {
  try {
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    const executablePath = isVercel || isProduction ? await chromium.executablePath : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await puppeteer.launch({
      executablePath: executablePath,
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.on('dialog', async (dialog) => {
      console.log(`Closing dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.goto(url);

    const content = await page.content();
    await browser.close();

    return cheerio.load(content);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}

async function fetchGamesData() {
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
      const team1Logo = match.find('li.lab_team_home span.avatar img').attr('src');

      const team2 = match.find('li.lab_team_away strong.name').text().trim();
      const team2Score = match.find('li.lab_team_away em.bf').text().trim();
      const team2Logo = match.find('li.lab_team_away span.avatar img').attr('src');

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
        liveLinks
      };

      games.push(game);
    });

    // Update the cache with the new data and timestamp
    cachedData.games = games;
    cachedData.timestamp = new Date().getTime();
  } catch (error) {
    console.error(error);
  }
}


let cachedData = {
  games: null,
  timestamp: null
};
const cacheDuration = 3 * 60 * 1000;

app.get('/api/games', (req, res) => {
  if (cachedData.games) {
    res.json(cachedData.games);
  } else {
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/parseLiveLinks', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: 'Missing URL parameter' });
    return;
  }

  const host = url.split('/').slice(0, 3).join('/');

  try {
    // const $ = await fetchHtml(url);
    const $ = await fetchHtml2(url); // 使用 fetchHtml2 函数


    const subChannels = $('.sub_channel a.item');
    const liveLinks = [];

    subChannels.each((i, el) => {
      const subChannel = $(el);
      const name = subChannel.text();
      const urlPath = subChannel.attr('data-play');
      const url = `${host}${urlPath}`;
      liveLinks.push({ name, url });
    });

    res.json(liveLinks);
  } catch (error) {
    console.error('Error fetching live links:', error.message);
    res.status(500).json({ error: 'Failed to fetch live links' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

fetchGamesData();
setInterval(fetchGamesData,
  1000 * 60 * 1
);
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

