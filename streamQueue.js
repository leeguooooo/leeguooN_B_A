// 渐进式流解析队列系统
// 一个一个慢慢解析，避免网络超时和并发问题

const getFullIframeSrc = require('./decode_url.js');
const axios = require('axios');

class StreamQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.results = {};
    this.kvBaseUrl = 'https://dokv.pwtk.cc/kv';
    this.kvSetUrl = 'https://dokv.pwtk.cc/kv/set';
    this.authToken = 'pwtk-api-key-2025';
    
    // 配置
    this.config = {
      delayBetweenRequests: 5000, // 每个请求间隔5秒
      maxRetries: 2,              // 每个链接最多重试2次
      timeoutPerRequest: 30000,   // 每个请求30秒超时
      batchSize: 1,               // 一次处理1个（可以调整）
      maxQueueSize: 100           // 队列最大长度
    };
    
    console.log('🚀 流解析队列系统已启动');
  }

  // 添加比赛到解析队列
  addGame(game) {
    if (this.queue.length >= this.config.maxQueueSize) {
      console.log('⚠️ 队列已满，跳过比赛:', game.team1, 'vs', game.team2);
      return false;
    }

    // 检查是否有有效的直播链接
    const validLinks = game.liveLinks?.filter(link => 
      link.url && !link.url.includes('javascript:void')
    );

    if (!validLinks || validLinks.length === 0) {
      console.log('⏭️ 跳过无效链接的比赛:', game.team1, 'vs', game.team2);
      return false;
    }

    const gameId = `${game.league}_${game.team1}_${game.team2}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '');
    
    // 检查是否已经解析过
    if (this.results[gameId]) {
      console.log('⏭️ 跳过已解析的比赛:', game.team1, 'vs', game.team2);
      return false;
    }

    const queueItem = {
      gameId,
      gameInfo: {
        league: game.league,
        team1: game.team1,
        team2: game.team2,
        gameTime: game.gameTime
      },
      liveUrl: validLinks[0].url,
      retries: 0,
      addedAt: Date.now()
    };

    this.queue.push(queueItem);
    console.log(`📝 添加到队列: ${game.team1} vs ${game.team2} (队列长度: ${this.queue.length})`);
    
    // 如果没有在处理，开始处理队列
    if (!this.processing) {
      this.startProcessing();
    }
    
    return true;
  }

  // 开始处理队列
  async startProcessing() {
    if (this.processing) {
      console.log('⚠️ 队列已在处理中');
      return;
    }

    this.processing = true;
    console.log('🔄 开始处理解析队列...');

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      await this.processItem(item);
      
      // 延迟，避免请求过快
      if (this.queue.length > 0) {
        console.log(`⏰ 等待${this.config.delayBetweenRequests/1000}秒后处理下一个...`);
        await this.sleep(this.config.delayBetweenRequests);
      }
    }

    this.processing = false;
    console.log('✅ 队列处理完成');
  }

  // 处理单个队列项
  async processItem(item) {
    const { gameId, gameInfo, liveUrl } = item;
    
    try {
      console.log(`🔍 解析 [${item.retries + 1}/${this.config.maxRetries + 1}]: ${gameInfo.team1} vs ${gameInfo.team2}`);
      console.log(`📡 URL: ${liveUrl}`);
      
      // 设置超时解析
      const streamUrl = await Promise.race([
        getFullIframeSrc(liveUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('解析超时')), this.config.timeoutPerRequest)
        )
      ]);

      // 从解析结果中提取m3u8地址
      let m3u8Url = null;
      if (streamUrl) {
        // 方式1: 从iframe URL参数中提取m3u8路径
        const m3u8Match = streamUrl.match(/id=([^&]+)/);
        if (m3u8Match) {
          let m3u8Path = decodeURIComponent(m3u8Match[1]);
          console.log(`🔍 提取到m3u8路径: ${m3u8Path}`);
          
          if (m3u8Path.startsWith('//')) {
            m3u8Url = 'https:' + m3u8Path;
          } else if (m3u8Path.startsWith('/live/')) {
            // 动态检测域名前缀 hdl6 vs hdl7
            const streamId = m3u8Path.match(/\/live\/(\d+)\.m3u8/);
            if (streamId) {
              const id = parseInt(streamId[1]);
              // 根据流ID范围决定使用hdl6还是hdl7
              const domain = (id > 50000000) ? 'hdl6.szsummer.cn' : 'hdl7.szsummer.cn';
              m3u8Url = `https://${domain}${m3u8Path}`;
              console.log(`🎯 智能域名选择: ${domain} (流ID: ${id})`);
            } else {
              m3u8Url = 'https://hdl7.szsummer.cn' + m3u8Path;
            }
          } else if (m3u8Path.includes('szsummer.cn')) {
            // 如果已经包含完整域名
            m3u8Url = m3u8Path.startsWith('http') ? m3u8Path : 'https://' + m3u8Path;
          }
        } 
        // 方式2: 如果直接是m3u8 URL
        else if (streamUrl.includes('.m3u8')) {
          m3u8Url = streamUrl;
        }
      }

      // 保存结果
      this.results[gameId] = {
        gameInfo,
        streamUrl: m3u8Url,
        iframeUrl: streamUrl,
        originalUrl: liveUrl,
        lastChecked: Date.now(),
        status: m3u8Url ? 'success' : 'no_stream'
      };

      console.log(`✅ 解析成功: ${gameInfo.team1} vs ${gameInfo.team2}`);
      console.log(`🎥 结果: ${m3u8Url || '无m3u8流'}`);

      // 异步保存到KV
      this.saveToKV(gameId);

    } catch (error) {
      console.log(`❌ 解析失败: ${gameInfo.team1} vs ${gameInfo.team2} - ${error.message}`);
      
      // 重试逻辑
      if (item.retries < this.config.maxRetries) {
        item.retries++;
        this.queue.unshift(item); // 重新添加到队列开头
        console.log(`🔄 将重试 ${item.retries}/${this.config.maxRetries}: ${gameInfo.team1} vs ${gameInfo.team2}`);
      } else {
        // 保存失败结果
        this.results[gameId] = {
          gameInfo,
          error: error.message,
          lastChecked: Date.now(),
          status: 'error'
        };
        console.log(`🚫 最终失败: ${gameInfo.team1} vs ${gameInfo.team2}`);
      }
    }
  }

  // 异步保存单个结果到KV
  async saveToKV(gameId) {
    try {
      const result = this.results[gameId];
      const kvKey = `games/streams/${gameId}`;
      
      await axios.post(this.kvSetUrl, {
        key: kvKey,
        value: JSON.stringify(result)
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      console.log(`💾 已保存到KV: ${result.gameInfo.team1} vs ${result.gameInfo.team2}`);
    } catch (error) {
      console.log(`⚠️ KV保存失败: ${gameId} - ${error.message}`);
    }
  }

  // 获取队列状态
  getStatus() {
    const totalProcessed = Object.keys(this.results).length;
    const successCount = Object.values(this.results).filter(r => r.status === 'success').length;
    const errorCount = Object.values(this.results).filter(r => r.status === 'error').length;
    
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      totalProcessed,
      successCount,
      errorCount,
      successRate: totalProcessed > 0 ? (successCount / totalProcessed * 100).toFixed(1) + '%' : '0%'
    };
  }

  // 获取所有结果
  getAllResults() {
    return this.results;
  }

  // 获取成功的结果
  getSuccessResults() {
    const results = {};
    Object.entries(this.results).forEach(([gameId, result]) => {
      if (result.status === 'success' && result.streamUrl) {
        results[gameId] = result;
      }
    });
    return results;
  }

  // 清空队列和结果
  clear() {
    this.queue = [];
    this.results = {};
    this.processing = false;
    console.log('🧹 队列和结果已清空');
  }

  // 工具函数：延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = StreamQueue;