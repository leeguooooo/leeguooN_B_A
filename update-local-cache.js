#!/usr/bin/env node

const axios = require('axios');
const fetchJrsGamesData = require('./fetchJrsGamesData');

async function updateLocalCache() {
  try {
    console.log('1. 抓取最新比赛数据...');
    const games = await fetchJrsGamesData();
    console.log(`成功抓取 ${games.length} 场比赛`);
    
    console.log('\n2. 更新本地API缓存...');
    const response = await axios.post('http://localhost:3000/api/updateGames', games, {
      headers: {
        'X-Api-Key': 'kuaikuaishiyongshuangjiegunheiheihahei',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('更新结果:', response.data);
    
    console.log('\n3. 验证缓存更新...');
    const verifyResponse = await axios.get('http://localhost:3000/api/games');
    const gamesData = Array.isArray(verifyResponse.data) ? verifyResponse.data : verifyResponse.data.games;
    console.log(`缓存中现有 ${gamesData.length} 场比赛`);
    
    // 显示前3场比赛
    console.log('\n缓存中的比赛:');
    gamesData.slice(0, 3).forEach((game, index) => {
      console.log(`${index + 1}. ${game.league} - ${game.gameTime} - ${game.team1} vs ${game.team2}`);
    });
    
    console.log('\n✅ 本地缓存更新成功！');
    console.log('请刷新前端页面查看最新数据。');
    
  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行更新
updateLocalCache();