const axios = require('axios');
const fetchGamesData = require('./fetchGamesDataFunction');
require('dotenv').config();

(async () => {
  try {
    const gamesData = await fetchGamesData();

    const apiUrl =
      process.env.VERCEL_API_URL || 'http://localhost:3000/api/updateGames';
    const apiKey = process.env.API_KEY;

    console.log('Sending games data to Vercel API...', apiUrl, apiKey);

    await axios.post(apiUrl, gamesData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    });

    console.log('Games data sent to Vercel API.');
  } catch (error) {
    console.error('Error fetching games data:', error.message);
  }
})();
