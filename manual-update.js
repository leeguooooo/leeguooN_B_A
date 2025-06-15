// 手动更新比赛数据
const axios = require('axios');

// 模拟今天的比赛数据
const today = new Date();
const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
const currentHour = today.getHours();
const currentMinute = today.getMinutes();

// 生成测试比赛数据
const testGames = [
  {
    gameTime: `${todayStr} ${(currentHour + 1).toString().padStart(2, '0')}:00`,
    league: 'NBA',
    team1: '湖人',
    team2: '勇士',
    team1Logo: '',
    team2Logo: '',
    team1Score: '',
    team2Score: '',
    liveLinks: [
      { name: '高清直播', url: 'http://example.com/live1' },
      { name: '标清直播', url: 'http://example.com/live2' }
    ]
  },
  {
    gameTime: `${todayStr} ${currentHour.toString().padStart(2, '0')}:30`,
    league: '日职联',
    team1: '横滨水手',
    team2: '鹿岛鹿角',
    team1Logo: '',
    team2Logo: '',
    team1Score: '1',
    team2Score: '0',
    liveLinks: [
      { name: '日本体育', url: 'http://example.com/live3' }
    ]
  },
  {
    gameTime: `${todayStr} ${(currentHour + 2).toString().padStart(2, '0')}:00`,
    league: 'CBA',
    team1: '广东东莞',
    team2: '北京首钢',
    team1Logo: '',
    team2Logo: '',
    team1Score: '',
    team2Score: '',
    liveLinks: [
      { name: 'CCTV5', url: 'http://example.com/live4' }
    ]
  },
  {
    gameTime: `${todayStr} ${currentHour.toString().padStart(2, '0')}:00`,
    league: '英超',
    team1: '曼联',
    team2: '利物浦',
    team1Logo: '',
    team2Logo: '',
    team1Score: '2',
    team2Score: '1',
    liveLinks: [
      { name: '英超直播', url: 'http://example.com/live5' }
    ]
  },
  {
    gameTime: `${todayStr} ${(currentHour - 1).toString().padStart(2, '0')}:00`,
    league: '日职联',
    team1: '浦和红钻',
    team2: '大阪樱花',
    team1Logo: '',
    team2Logo: '',
    team1Score: '3',
    team2Score: '2',
    liveLinks: [
      { name: '日本体育2', url: 'http://example.com/live6' }
    ]
  }
];

// 更新到KV存储
async function updateTestData() {
  try {
    console.log('准备更新测试数据...');
    console.log(`当前时间: ${today.toLocaleString('zh-CN')}`);
    console.log(`生成了 ${testGames.length} 场比赛数据`);
    
    // 这里需要KV_AUTH_TOKEN才能更新
    // 由于没有token，我们只能显示数据
    console.log('\n比赛数据预览:');
    testGames.forEach((game, index) => {
      console.log(`${index + 1}. ${game.gameTime} ${game.league}: ${game.team1} vs ${game.team2}`);
    });
    
    console.log('\n注意: 需要 KV_AUTH_TOKEN 才能实际更新数据');
    console.log('请在 Vercel 环境变量中设置 KV_AUTH_TOKEN');
    
  } catch (error) {
    console.error('更新失败:', error);
  }
}

updateTestData();