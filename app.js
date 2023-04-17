const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;
const fetchGamesData = require('./fetchGamesDataFunction');
require('dotenv').config();

async function fetchHtml2(url) {
  try {
    const response = await axios.get(url);
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Error fetching URL: ${url}`);
    throw error;
  }
}

let cachedData = {
  games: null,
  timestamp: null,
};

const cacheDuration = 3 * 60 * 1000;

app.get('/api/games', async (req, res) => {
  if (cachedData.games) {
    res.json(cachedData.games);
  } else {
    try {
      // await fetchGamesData();
      if (cachedData.games) {
        res.json(cachedData.games);
      } else {
        res
          .status(500)
          .json({ error: 'An error occurred while fetching data.' });
      }
    } catch (error) {
      console.error('Error fetching games data:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
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

app.post('/api/updateGames', async (req, res) => {
  console.log('Received games data from Vercel API');
  const apiKey = req.header('X-Api-Key');

  console.log('apiKey', apiKey);

  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  req.on('data', function (data) {
    const gamesData = JSON.parse(data);

    if (!gamesData) {
      res.status(400).json({ error: 'No data provided' });
      return;
    }

    // Store the received games data and timestamp
    cachedData.games = gamesData;
    cachedData.timestamp = new Date().getTime();

    console.log('Updated games data:', cachedData.games.length, 'games');

    res.json({ success: true });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});
