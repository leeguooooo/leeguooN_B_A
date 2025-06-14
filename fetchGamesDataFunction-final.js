const cheerio = require('cheerio');
const axios = require('axios');

// 生成随机User-Agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 解析重定向链
async function resolveRedirectChain() {
  console.log('🔗 解析重定向链...');
  
  try {
    // 第一步：获取日期标识
    const date = new Date();
    const dateId = (date.getMonth() + 1).toString() + date.getDate().toString();
    console.log('📅 日期标识:', dateId);
    
    // 第二步：构造第一个重定向URL
    const originalUrl = "http://www.jrskan.com/";
    const encodedOriginalUrl = Buffer.from(originalUrl).toString('base64');
    const firstRedirectUrl = `https://gn${dateId}.hw3.hong91.top/api.2.JS?1,${encodedOriginalUrl}`;
    
    console.log('🎯 第一个重定向URL:', firstRedirectUrl);
    
    // 第三步：获取第一个重定向的内容
    const response1 = await axios.get(firstRedirectUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'http://www.jrskan.com/',
      },
      timeout: 10000
    });
    
    console.log('✅ 第一次重定向成功');
    
    // 第四步：解析第二个重定向URL
    const jsContent = response1.data;
    console.log('📝 JS内容:', jsContent);
    
    // 提取base64编码的URL
    const bajm2Match = jsContent.match(/atob\('([^']+)'\)/g);
    if (bajm2Match && bajm2Match[1]) {
      const encodedUrl = bajm2Match[1].match(/atob\('([^']+)'\)/)[1];
      const decodedUrl = Buffer.from(encodedUrl, 'base64').toString();
      const finalUrl = decodedUrl.replace(/\|/g, '.');
      
      console.log('🌐 最终目标URL:', finalUrl);
      return finalUrl;
    }
    
    // 如果解析失败，使用发现的URL
    return 'http://3.hqggfw.com';
    
  } catch (error) {
    console.error('❌ 重定向解析失败:', error.message);
    // 返回已知的最终URL
    return 'http://3.hqggfw.com';
  }
}

// 增强版数据获取
async function fetchGamesDataFinal() {
  console.log('🚀 开始最终版数据抓取...');
  
  try {
    // 获取真实的数据URL
    const realUrl = await resolveRedirectChain();
    console.log('🎯 使用真实URL:', realUrl);
    
    // 直接请求真实数据源
    const response = await axios.get(realUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Referer': 'http://www.jrskan.com/'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    console.log('✅ 成功获取页面内容');
    console.log('📊 响应状态:', response.status);
    console.log('📄 内容长度:', response.data.length);
    
    const $ = cheerio.load(response.data);
    
    // 调试信息
    console.log('🔍 页面标题:', $('title').text());
    console.log('🔍 页面内容预览:', $('body').text().substring(0, 200));
    
    // 查找比赛数据结构
    const matchList = $('div.loc_match_list');
    console.log('📋 找到比赛列表容器:', matchList.length);
    
    if (matchList.length === 0) {
      // 尝试其他可能的选择器
      console.log('🔍 尝试其他选择器...');
      const alternatives = [
        'div.match_list',
        'div.game_list', 
        'div.live_list',
        'ul.match',
        'ul.game',
        '.match-item',
        '.game-item'
      ];
      
      for (const selector of alternatives) {
        const alt = $(selector);
        if (alt.length > 0) {
          console.log(`✅ 找到替代选择器: ${selector}, 数量: ${alt.length}`);
          break;
        }
      }
      
      // 打印页面结构用于调试
      console.log('📋 页面主要结构:');
      $('div[class*="match"], div[class*="game"], div[class*="live"]').each((i, el) => {
        console.log(`   - ${$(el).attr('class')} (${$(el).children().length} 子元素)`);
      });
    }
    
    const matches = matchList.find('ul.item.play');
    console.log('🎮 找到比赛条目:', matches.length);
    
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
        };

        games.push(game);
        console.log(`✅ 解析比赛 ${index + 1}: ${team1} vs ${team2} (${league})`);
      }
    });

    console.log(`🎉 成功解析 ${games.length} 场比赛`);
    
    // 如果没有找到数据，保存页面内容用于调试
    if (games.length === 0) {
      const fs = require('fs');
      fs.writeFileSync('./debug-page.html', response.data);
      console.log('💾 页面内容已保存到 debug-page.html 用于调试');
    }
    
    return games;
    
  } catch (error) {
    console.error('💥 最终版数据抓取失败:', error.message);
    console.error('🔧 错误详情:', error.response?.status, error.response?.statusText);
    return [];
  }
}

module.exports = fetchGamesDataFinal;