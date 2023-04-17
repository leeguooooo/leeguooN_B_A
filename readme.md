[nba.leeguoo.com](nba.leeguoo.com)



如果你不想使用 Redis 或其他外部存储服务，你可以使用 Vercel 的 Key-Value 存储，即 Vercel 环境变量。虽然这不是最佳实践，但对于小型项目和缓存应用，这种方法可行。

首先，在 Vercel 项目设置中创建两个环境变量，一个用于存储游戏数据（例如，GAMES_DATA），另一个用于存储时间戳（例如，GAMES_TIMESTAMP）。

接下来，修改 fetchGamesData 函数以使用 Vercel 环境变量而不是内存中的 cachedData：

```javascript

const axios = require('axios');

async function updateVercelEnvironmentVariables(games, timestamp) {
  const url = `https://api.vercel.com/v1/projects/{YOUR_PROJECT_ID}/env`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.VERCEL_API_KEY}`,
  };

  const payload = [
    {
      key: 'GAMES_DATA',
      value: JSON.stringify(games),
      target: ['production'],
    },
    {
      key: 'GAMES_TIMESTAMP',
      value: timestamp.toString(),
      target: ['production'],
    },
  ];

  try {
    await axios.patch(url, payload, { headers });
  } catch (error) {
    console.error('Error updating Vercel environment variables:', error.message);
  }
}

async function fetchGamesData() {
  console.log('Fetching games data...');
  try {
    // ... the rest of the function ...

    // Update the Vercel environment variables with the new data and timestamp
    await updateVercelEnvironmentVariables(games, new Date().getTime());
  } catch (error) {
    console.error(error);
  }
}
```
最后，修改 /api/games 路由以使用 Vercel 环境变量：

```javascript
app.get('/api/games', async (req, res) => {
  const gamesData = process.env.GAMES_DATA;
  const timestamp = parseInt(process.env.GAMES_TIMESTAMP, 10);
  const now = new Date().getTime();

  if (gamesData && timestamp && now - timestamp <= cacheDuration) {
    res.json(JSON.parse(gamesData));
  } else {
    try {
      await fetchGamesData();
      const updatedGamesData = process.env.GAMES_DATA;
      if (updatedGamesData) {
        res.json(JSON.parse(updatedGamesData));
      } else {
        res.status(500).json({ error: 'An error occurred while fetching data.' });
      }
    } catch (error) {
      console.error('Error fetching games data:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  }
});
```
这样，你就可以使用 Vercel 环境变量实现缓存功能。需要注意的是，这种方法可能会导致环境变量的频繁更新，可能不适合大型项目或具有大量活动数据的应用程序。在这种情况下，选择 Redis 或其他数据库作为缓存存储是更好的选择。
