const axios = require('axios');

class CacheManager {
  constructor() {
    this.kvBaseUrl = 'https://dokv.pwtk.cc/kv';
    this.kvSetUrl = 'https://dokv.pwtk.cc/kv/set';
    this.cacheKeys = {
      games: 'games/jrs/all',
      gamesNBA: 'games/jrs/nba',
      gamesCBA: 'games/jrs/cba',
      streams: 'games/jrs/streams',
      lastUpdate: 'games/jrs/last_update'
    };
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  }

  // 从KV存储获取数据
  async get(key) {
    try {
      const response = await axios.get(`${this.kvBaseUrl}/${key}`);
      return response.data;
    } catch (error) {
      console.log(`KV获取失败 ${key}:`, error.message);
      return null;
    }
  }

  // 存储数据到KV
  async set(key, value, authToken) {
    try {
      const response = await axios.post(this.kvSetUrl, 
        { 
          key: key,
          value: JSON.stringify(value) 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      return response.data.success;
    } catch (error) {
      console.log(`KV存储失败 ${key}:`, error.message);
      return false;
    }
  }

  // 获取缓存的比赛数据
  async getCachedGames() {
    const data = await this.get(this.cacheKeys.games);
    if (data && typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return data;
  }

  // 获取缓存的流数据
  async getCachedStreams() {
    const data = await this.get(this.cacheKeys.streams);
    if (data && typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return {};
      }
    }
    return data || {};
  }

  // 获取最后更新时间
  async getLastUpdate() {
    const data = await this.get(this.cacheKeys.lastUpdate);
    return data ? parseInt(data) : 0;
  }

  // 检查缓存是否需要更新 (5分钟过期)
  async shouldUpdateCache() {
    const lastUpdate = await this.getLastUpdate();
    const now = Date.now();
    return (now - lastUpdate) > this.cacheExpiry;
  }

  // 存储比赛和流数据
  async cacheGamesAndStreams(games, streams, authToken) {
    const timestamp = Date.now();
    
    // 按联赛类型分类
    const nbaGames = games.filter(game => game.league.includes('NBA') || game.league.includes('WNBA'));
    const cbaGames = games.filter(game => game.league.includes('CBA') || game.league.includes('中职篮'));
    
    const results = await Promise.all([
      this.set(this.cacheKeys.games, games, authToken),
      this.set(this.cacheKeys.gamesNBA, nbaGames, authToken),
      this.set(this.cacheKeys.gamesCBA, cbaGames, authToken),
      this.set(this.cacheKeys.streams, streams, authToken),
      this.set(this.cacheKeys.lastUpdate, timestamp, authToken)
    ]);

    const success = results.every(r => r);
    if (success) {
      console.log(`✅ 缓存更新成功: 全部${games.length}场, NBA ${nbaGames.length}场, CBA ${cbaGames.length}场, 流${Object.keys(streams).length}个`);
    }
    return success;
  }

  // 智能获取比赛数据 (先检查缓存，过期才爬取)
  async getGames(fetchFunction, authToken) {
    // 1. 检查是否需要更新
    const needUpdate = await this.shouldUpdateCache();
    
    if (!needUpdate) {
      console.log('📋 使用缓存的比赛数据');
      const cachedGames = await this.getCachedGames();
      if (cachedGames && Array.isArray(cachedGames)) {
        return cachedGames;
      }
    }

    // 2. 缓存过期或无效，重新抓取
    console.log('🔄 缓存过期，重新抓取比赛数据...');
    try {
      const freshGames = await fetchFunction();
      
      // 3. 异步更新缓存 (不阻塞响应)
      if (authToken) {
        this.updateCacheAsync(freshGames, authToken);
      }
      
      return freshGames;
    } catch (error) {
      console.log('⚠️ 抓取失败，尝试使用旧缓存');
      const cachedGames = await this.getCachedGames();
      return cachedGames || [];
    }
  }

  // 异步更新缓存并解析流地址
  async updateCacheAsync(games, authToken) {
    const getFullIframeSrc = require('./decode_url.js');
    const streams = {};
    
    // 为当前活跃的联赛解析流地址 - 按时间段优先
    const now = new Date();
    const currentHour = now.getHours();
    
    let priorityLeagues = [];
    
    // 根据时间段确定优先联赛
    if (currentHour >= 0 && currentHour < 8) {
      // 凌晨: 美洲联赛为主
      priorityLeagues = ['NBA', 'WNBA', '美职业', '巴西', '智利', '秘鲁', '哥伦', '乌拉'];
    } else if (currentHour >= 8 && currentHour < 16) {
      // 上午到下午: 亚太联赛为主  
      priorityLeagues = ['中超', 'CBA', '日职', '韩K', '澳', '新西兰'];
    } else {
      // 晚上: 欧洲联赛为主
      priorityLeagues = ['英超', '西甲', '德甲', '意甲', '法甲', '欧', '拉脱', '立陶', '爱超', '白俄'];
    }
    
    // 同时包含正在进行或即将开始的比赛(2小时内)
    const priorityGames = games.filter(game => {
      // 检查联赛类型
      const isTargetLeague = priorityLeagues.some(league => game.league.includes(league));
      
      // 检查时间(2小时内的比赛优先)
      const gameTime = new Date(`2025-${game.gameTime.replace('06-', '06/')}`);
      const timeDiff = Math.abs(now - gameTime) / (1000 * 60); // 分钟差
      const isNearTime = timeDiff <= 120; // 2小时内
      
      return isTargetLeague || isNearTime;
    }).slice(0, 12); // 增加到12场，当前时段更多比赛

    console.log(`🎯 开始解析 ${priorityGames.length} 场优先比赛的流地址...`);
    if (priorityGames.length === 0) {
      console.log(`⚠️ 没有找到优先比赛，当前时间: ${currentHour}点，优先联赛: ${priorityLeagues.join(', ')}`);
      console.log(`📋 所有比赛联赛: ${games.map(g => g.league).join(', ')}`);
      return;
    }

    // 并发解析多个流地址
    const streamPromises = priorityGames.map(async (game, index) => {
      if (!game.liveLinks || game.liveLinks.length === 0) return;
      
      // 生成游戏ID
      const gameId = `${game.league}_${game.team1}_${game.team2}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '');
      
      // 寻找有效的直播链接 (跳过javascript:void(0))
      const validLinks = game.liveLinks.filter(link => 
        link.url && !link.url.includes('javascript:void')
      );
      
      if (validLinks.length === 0) return;

      try {
        // 尝试解析第一个有效链接
        const liveUrl = validLinks[0].url;
        console.log(`🔍 解析: ${game.team1} vs ${game.team2} (${liveUrl})`);
        
        const streamUrl = await getFullIframeSrc(liveUrl);
        
        // 从解析结果中提取m3u8地址
        let m3u8Url = null;
        if (streamUrl) {
          const m3u8Match = streamUrl.match(/id=([^&]+)/);
          if (m3u8Match) {
            let m3u8Path = decodeURIComponent(m3u8Match[1]);
            if (m3u8Path.startsWith('//')) {
              m3u8Url = 'https:' + m3u8Path;
            } else if (m3u8Path.startsWith('/live/')) {
              // 智能域名选择：根据流ID决定hdl6还是hdl7
              const streamId = m3u8Path.match(/\/live\/(\d+)\.m3u8/);
              if (streamId) {
                const id = parseInt(streamId[1]);
                const domain = (id > 50000000) ? 'hdl6.szsummer.cn' : 'hdl7.szsummer.cn';
                m3u8Url = `https://${domain}${m3u8Path}`;
              } else {
                m3u8Url = 'https://hdl7.szsummer.cn' + m3u8Path;
              }
            } else if (m3u8Path.includes('szsummer.cn')) {
              m3u8Url = m3u8Path.startsWith('http') ? m3u8Path : 'https://' + m3u8Path;
            }
          }
        }

        streams[gameId] = {
          gameInfo: {
            league: game.league,
            team1: game.team1,
            team2: game.team2,
            gameTime: game.gameTime
          },
          streamUrl: m3u8Url,
          iframeUrl: streamUrl,
          originalUrl: liveUrl,
          lastChecked: Date.now(),
          status: m3u8Url ? 'success' : 'failed'
        };

        console.log(`✅ 解析成功: ${game.team1} vs ${game.team2} -> ${m3u8Url ? 'HLS流' : '无流地址'}`);
      } catch (error) {
        console.log(`❌ 解析失败: ${game.team1} vs ${game.team2} - ${error.message}`);
        streams[gameId] = {
          gameInfo: {
            league: game.league,
            team1: game.team1,
            team2: game.team2,
            gameTime: game.gameTime
          },
          error: error.message,
          lastChecked: Date.now(),
          status: 'error'
        };
      }
    });

    // 等待所有解析完成 (设置超时避免卡死)
    try {
      await Promise.race([
        Promise.allSettled(streamPromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error('解析超时')), 45000)) // 45秒超时
      ]);
    } catch (error) {
      console.log('⚠️ 流解析超时，使用已解析的结果');
    }

    console.log(`🎊 流解析完成，成功解析 ${Object.keys(streams).length} 个流地址`);
    
    // 将流地址集成到比赛数据中
    const gamesWithStreams = this.integrateStreamsToGames(games, streams);
    
    await this.cacheGamesAndStreams(gamesWithStreams, streams, authToken);
  }

  // 将流地址集成到比赛数据中
  integrateStreamsToGames(games, streams) {
    return games.map(game => {
      const gameId = `${game.league}_${game.team1}_${game.team2}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '');
      const streamInfo = streams[gameId];
      
      if (streamInfo && streamInfo.status === 'success' && streamInfo.streamUrl) {
        return {
          ...game,
          directStream: {
            m3u8Url: streamInfo.streamUrl,
            proxyUrl: `/proxy/m3u8?url=${encodeURIComponent(streamInfo.streamUrl)}`,
            status: 'ready',
            lastChecked: streamInfo.lastChecked
          }
        };
      } else {
        return {
          ...game,
          directStream: {
            status: 'unavailable',
            message: streamInfo ? streamInfo.error : '未解析'
          }
        };
      }
    });
  }

  // 获取特定比赛的流地址
  async getStreamForGame(gameId, liveUrl, parseFunction) {
    const streams = await this.getCachedStreams();
    const cached = streams[gameId];
    
    // 如果有缓存且未过期 (10分钟)
    if (cached && (Date.now() - cached.lastChecked) < 10 * 60 * 1000) {
      console.log(`📺 使用缓存的流地址: ${gameId}`);
      return cached.streamUrl;
    }

    // 实时解析
    console.log(`🔍 实时解析流地址: ${gameId}`);
    try {
      return await parseFunction(liveUrl);
    } catch (error) {
      // 如果有旧缓存，返回旧的
      return cached ? cached.streamUrl : null;
    }
  }
}

module.exports = CacheManager;