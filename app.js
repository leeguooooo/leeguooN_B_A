const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;
const fetchGamesData = require('./fetchGamesDataFunction');
require('dotenv').config();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper function to filter games by type
function filterGamesByType(games, type) {
  return games.filter(game => game.league === type);
}

// Helper function to handle errors
function handleError(res, error) {
  console.error('Error:', error.message);
  res.status(500).json({ error: 'An error occurred while fetching data.' });
}

// Fetch HTML from URL and return Cheerio object
async function fetchHtml(url) {
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

app.get('/api/games', async (req, res) => {
  const { type } = req.query;

  if (cachedData.games) {
    const games = type
      ? filterGamesByType(cachedData.games, type)
      : cachedData.games;
    res.json(games);
    return;
  }

  try {
    let games = await fetchGamesData();
    if (!games) throw new Error('Failed to fetch games data.');

    cachedData.games = games;
    cachedData.timestamp = new Date().getTime();

    games = type ? filterGamesByType(games, type) : games;
    res.json(games);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/parseLiveLinks', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).json({ error: 'Missing URL parameter' });
    return;
  }

  const host = url.split('/').slice(0, 3).join('/');

  try {
    const $ = await fetchHtml(url);
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

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('apiKey', apiKey);
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

app.post('/fetchGamesData', async (req, res) => {
  console.log('Received games data from Vercel API');
  const apiKey = req.header('X-Api-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.log('apiKey', apiKey);
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  const gamesData = await fetchGamesData();

  cachedData.games = gamesData;
  cachedData.timestamp = new Date().getTime();

  console.log('Updated games data:', cachedData.games.length, 'games');
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});
