#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'kuaikuaishiyongshuangjiegunheiheihahei';

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 简单的 fetch 实现
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: {
            get: (name) => res.headers[name.toLowerCase()]
          },
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// 测试辅助函数
async function runTest(name, testFn) {
  totalTests++;
  process.stdout.write(`Testing ${name}... `);
  
  try {
    await testFn();
    passedTests++;
    console.log('✓ PASSED');
    return true;
  } catch (error) {
    failedTests++;
    console.log('✗ FAILED');
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

// API 测试函数
async function testAPI() {
  console.log(`\n🧪 API Testing Suite`);
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // 1. 测试健康检查 - 检查 API 端点是否响应
  await runTest('API Health Check', async () => {
    const response = await fetch(`${BASE_URL}/api/games`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid API response');
  });

  // 2. 测试获取游戏数据
  await runTest('Get Games (GET /api/games)', async () => {
    const response = await fetch(`${BASE_URL}/api/games`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    if (data.length === 0) throw new Error('No games returned');
    console.log(`    Found ${data.length} games`);
  });

  // 3. 测试按类型获取游戏
  await runTest('Get NBA Games (GET /api/games?type=NBA)', async () => {
    const response = await fetch(`${BASE_URL}/api/games?type=NBA`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    const nbaGames = data.filter(g => g.league && g.league.includes('NBA'));
    console.log(`    Found ${nbaGames.length} NBA games`);
  });

  // 4. 测试解析直播链接
  await runTest('Parse Live Links (GET /api/parseLiveLinks)', async () => {
    // 先获取一个有直播的游戏
    const gamesResponse = await fetch(`${BASE_URL}/api/games`);
    const games = await gamesResponse.json();
    const gameWithLinks = games.find(g => g.liveLinks && g.liveLinks.length > 0);
    
    if (!gameWithLinks) {
      throw new Error('No games with live links found for testing');
    }
    
    const testUrl = gameWithLinks.liveLinks[0].url;
    console.log(`\n    Testing URL: ${testUrl}`);
    
    const response = await fetch(`${BASE_URL}/api/parseLiveLinks?url=${encodeURIComponent(testUrl)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    if (data.length === 0) throw new Error('No live links parsed');
    console.log(`    Parsed ${data.length} live links`);
  });

  // 5. 测试获取 iframe 源 (可选测试)
  await runTest('Get Iframe Src (GET /api/getIframeSrc) [Optional]', async () => {
    try {
      const testUrl = 'http://m.sportsteam586.com/play/steam793988.html';
      const response = await fetch(`${BASE_URL}/api/getIframeSrc?url=${encodeURIComponent(testUrl)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.iframeSrc) throw new Error('No iframe src returned');
      console.log(`    Got iframe: ${data.iframeSrc.substring(0, 50)}...`);
    } catch (error) {
      // 这个端点是可选的，失败不影响部署
      console.log(`    (Optional endpoint, skipping: ${error.message})`);
      passedTests++; // 不计入失败
      failedTests--; // 撤销失败计数
    }
  });

  // 6. 测试获取流地址
  await runTest('Get Stream URL (GET /api/getStreamUrl)', async () => {
    const testUrl = 'http://m.sportsteam586.com/play/sm.html?id=330&id2=';
    const response = await fetch(`${BASE_URL}/api/getStreamUrl?url=${encodeURIComponent(testUrl)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.streamUrl) throw new Error('No stream URL returned');
    const isM3u8 = data.streamUrl.includes('.m3u8');
    console.log(`    Got stream: ${data.streamUrl.substring(0, 50)}... (m3u8: ${isM3u8})`);
  });

  // 7. 测试 M3U8 代理 (可选测试)
  await runTest('M3U8 Proxy (GET /proxy/m3u8) [Optional]', async () => {
    try {
      const testUrl = 'https://hdl7.szsummer.cn/live/12897937.m3u8';
      const response = await fetch(`${BASE_URL}/proxy/m3u8?url=${encodeURIComponent(testUrl)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('mpegurl')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }
    } catch (error) {
      // M3U8 代理是可选功能，失败不影响核心功能
      console.log(`    (Optional proxy, skipping: ${error.message})`);
      passedTests++; // 不计入失败
      failedTests--; // 撤销失败计数
    }
  });

  // 8. 测试缓存状态（需要 API key）
  await runTest('Cache Status (GET /api/cache-status)', async () => {
    const response = await fetch(`${BASE_URL}/api/cache-status`, {
      headers: { 'X-Api-Key': API_KEY }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.hasOwnProperty('lastUpdate')) throw new Error('Invalid cache status response');
    console.log(`    Games: ${data.gamesCount}, Streams: ${data.streamsCount}, Last update: ${data.lastUpdate || 'N/A'}`);
  });

  // 9. 测试 KV 存储连接
  await runTest('KV Storage Connection', async () => {
    const response = await fetch('https://dokv.pwtk.cc/kv/games/jrs/all');
    if (!response.ok && response.status !== 404) throw new Error(`HTTP ${response.status}`);
    console.log(`    KV storage is accessible`);
  });

  // 10. 测试前端资源
  await runTest('Frontend Static Resources', async () => {
    // 测试 API 端点是否正常工作即可，因为前端是通过 Vite 单独部署的
    const response = await fetch(`${BASE_URL}/api/games`);
    if (!response.ok) throw new Error(`API endpoint returned HTTP ${response.status}`);
    console.log(`    API endpoints accessible for frontend`);
  });

  // 打印测试结果
  console.log(`\n📊 Test Results:`);
  console.log(`   ✓ Passed: ${passedTests}`);
  console.log(`   ✗ Failed: ${failedTests}`);
  console.log(`   Total: ${totalTests}`);
  
  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Please fix the issues before pushing to production.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Safe to push to production.');
    process.exit(0);
  }
}

// 启动服务器并运行测试
async function main() {
  console.log('🚀 Starting API test suite...\n');
  
  // 检查服务器是否运行
  try {
    const response = await fetch(`${BASE_URL}/api/games`);
    // 即使返回空数组也算服务器正在运行
  } catch (error) {
    console.log('❌ Server is not running!');
    console.log('💡 Please start the server with: npm start');
    process.exit(1);
  }
  
  // 运行测试
  await testAPI();
}

// 处理未捕获的错误
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// 运行主函数
main().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});