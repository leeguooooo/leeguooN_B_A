const cheerio = require('cheerio');
const axios = require('axios');

// 工作的目标网站（按优先级排序）
const WORKING_SITES = [
  'https://m.jrs03.com',      // 移动版，72个比赛元素
  'https://m.jrs16.com',      // 移动版，72个比赛元素  
  'https://m.jrs80.com',      // 移动版，72个比赛元素
  'https://m.jrkan2023.com',  // 移动版，72个比赛元素
  'https://www.jrs21.com',    // 桌面版，11个比赛元素
  'https://www.jrs03.com'     // 桌面版，11个比赛元素
];

// 生成随机User-Agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 获取随机延迟
function randomDelay(min = 500, max = 1500) {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

// 从单个网站获取数据
async function fetchFromSite(url) {
  try {
    console.log(`🎯 尝试获取数据: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log(`✅ 成功获取 ${url} (${response.data.length} 字符)`);
    
    const $ = cheerio.load(response.data);
    
    // 检查是否有比赛数据
    const matchList = $('div.loc_match_list');
    const matches = matchList.find('ul.item.play');
    
    console.log(`📋 找到比赛列表容器: ${matchList.length}`);
    console.log(`🎮 找到比赛条目: ${matches.length}`);
    
    if (matches.length === 0) {
      throw new Error('未找到比赛数据结构');
    }
    
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
        const liveLinkName = liveLinkElement.text().trim();
        if (liveLinkURL && liveLinkName) {
          liveLinks.push({ name: liveLinkName, url: liveLinkURL });
        }
      });

      // 只添加有效的比赛数据
      if (league && gameTime && team1 && team2) {
        const game = {
          league,
          gameTime,
          team1,
          team1Score: team1Score || '',
          team1Logo: team1Logo || '',
          team2,
          team2Score: team2Score || '',
          team2Logo: team2Logo || '',
          liveLinks,
          source: url // 记录数据源
        };

        games.push(game);
      }
    });

    console.log(`🎉 从 ${url} 成功解析 ${games.length} 场比赛`);
    return games;
    
  } catch (error) {
    console.error(`❌ 从 ${url} 获取数据失败:`, error.message);
    throw error;
  }
}

// 主数据抓取函数 - 支持多站点容错
async function fetchGamesDataWorking() {
  console.log('🚀 开始获取体育比赛数据...');
  console.log(`📡 可用站点数量: ${WORKING_SITES.length}`);
  
  for (let i = 0; i < WORKING_SITES.length; i++) {
    const site = WORKING_SITES[i];
    
    try {
      // 随机延迟避免被检测
      if (i > 0) {
        await randomDelay(1000, 3000);
      }
      
      const games = await fetchFromSite(site);
      
      if (games && games.length > 0) {
        console.log(`🎊 数据获取成功！使用站点: ${site}`);
        console.log(`📊 获取到 ${games.length} 场比赛`);
        
        // 统计联赛分布
        const leagueStats = {};
        games.forEach(game => {
          leagueStats[game.league] = (leagueStats[game.league] || 0) + 1;
        });
        
        console.log('📈 联赛分布:');
        Object.entries(leagueStats).slice(0, 5).forEach(([league, count]) => {
          console.log(`   - ${league}: ${count} 场`);
        });
        
        return games;
      }
      
    } catch (error) {
      console.error(`⚠️  站点 ${site} 失败，尝试下一个...`);
      
      // 如果是最后一个站点，抛出错误
      if (i === WORKING_SITES.length - 1) {
        console.error('💀 所有站点都失败了');
        throw new Error('所有数据源都无法访问');
      }
    }
  }
  
  // 如果到这里说明所有站点都失败了
  console.error('💀 所有站点都无法获取数据');
  return [];
}

// 导出函数
module.exports = fetchGamesDataWorking;