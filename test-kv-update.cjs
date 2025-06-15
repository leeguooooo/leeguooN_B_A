#!/usr/bin/env node

const axios = require('axios');
const path = require('path');

// 动态导入 fetchGamesDataFunction
async function testKVUpdate() {
  try {
    console.log('1. 正在导入数据抓取函数...');
    // 使用动态 import 加载 ESM 模块
    const fetchModule = await import(path.join(__dirname, 'fetchGamesDataFunction.js'));
    const fetchJrsGamesData = fetchModule.fetchJrsGamesData;
    
    console.log('\n2. 开始抓取最新比赛数据...');
    const gamesData = await fetchJrsGamesData();
    console.log(`成功抓取 ${gamesData.length} 场比赛`);
    
    // 显示前3场比赛
    console.log('\n前3场比赛:');
    gamesData.slice(0, 3).forEach((game, index) => {
      console.log(`${index + 1}. ${game.league} - ${game.gameTime} - ${game.team1} vs ${game.team2}`);
    });
    
    console.log('\n3. 更新KV存储...');
    
    // 更新比赛数据
    const updateResponse = await axios.put(
      'https://dokv.pwtk.cc/kv/games/jrs/all',
      gamesData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('比赛数据更新状态:', updateResponse.status);
    
    // 更新时间戳
    const timestamp = Date.now();
    const timestampResponse = await axios.put(
      'https://dokv.pwtk.cc/kv/games/jrs/last_update',
      timestamp,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('时间戳更新状态:', timestampResponse.status);
    console.log('更新时间:', new Date(timestamp).toLocaleString('zh-CN'));
    
    console.log('\n4. 验证更新结果...');
    
    // 验证数据
    const verifyResponse = await axios.get('https://dokv.pwtk.cc/kv/games/jrs/all');
    const verifiedData = verifyResponse.data;
    console.log(`KV中现有 ${verifiedData.length} 场比赛`);
    
    // 验证时间戳
    const verifyTimestamp = await axios.get('https://dokv.pwtk.cc/kv/games/jrs/last_update');
    console.log('KV中的更新时间:', new Date(verifyTimestamp.data).toLocaleString('zh-CN'));
    
    console.log('\n✅ KV数据更新成功！');
    
  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testKVUpdate();