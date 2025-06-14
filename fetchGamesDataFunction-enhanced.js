const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const axios = require('axios');

// 生成随机User-Agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 生成随机延迟
function randomDelay(min = 1000, max = 3000) {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

// 模拟人类行为的页面操作
async function simulateHumanBehavior(page) {
  // 随机移动鼠标
  await page.mouse.move(Math.random() * 1000, Math.random() * 800);
  await randomDelay(100, 500);
  
  // 随机滚动
  await page.evaluate(() => {
    window.scrollTo(0, Math.random() * 500);
  });
  await randomDelay(200, 800);
}

async function fetchWithAxiosAdvanced(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000,
      maxRedirects: 10,
      validateStatus: function (status) {
        return status < 500; // 接受所有小于500的状态码
      }
    });
    return response.data;
  } catch (error) {
    console.error('Enhanced Axios fetch failed:', error.message);
    throw error;
  }
}

async function fetchHtmlAdvanced(url) {
  let browser = null;
  try {
    console.log('启动增强版浏览器爬虫...');
    
    const options = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
        '--start-maximized',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // 禁用图片加载以提高速度
        '--media-cache-size=0',
        '--disk-cache-size=0'
      ],
      headless: 'new', // 使用新的headless模式
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      timeout: 60000,
      ignoreDefaultArgs: ['--enable-automation']
    };

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // 删除webdriver属性以避免检测
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // 删除自动化相关属性
      delete navigator.__proto__.webdriver;
      
      // 伪造插件信息
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // 伪造语言
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en']
      });
    });

    // 设置随机User-Agent
    const userAgent = getRandomUserAgent();
    await page.setUserAgent(userAgent);
    
    // 设置更真实的请求头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    });

    // 设置JavaScript启用
    await page.setJavaScriptEnabled(true);

    // 不拦截请求，让JavaScript正常运行
    await page.setRequestInterception(false);

    // 处理对话框
    page.on('dialog', async dialog => {
      console.log(`处理对话框: ${dialog.message()}`);
      await dialog.accept();
    });

    // 添加重试机制
    let retries = 5;
    let content = null;
    
    while (retries > 0 && !content) {
      try {
        console.log(`尝试访问 ${url} (剩余尝试次数: ${retries})`);
        
        // 增加导航超时
        await page.setDefaultNavigationTimeout(45000);
        
        // 访问页面并等待网络空闲
        await page.goto(url, { 
          waitUntil: ['networkidle2'], // 等待网络连接数小于2个
          timeout: 45000 
        });
        
        // 等待页面加载
        await randomDelay(2000, 4000);
        
        // 模拟人类行为
        await simulateHumanBehavior(page);
        
        // 等待JavaScript执行完成，寻找实际内容
        // 检查是否有动态加载的内容
        await page.waitForFunction(() => {
          // 检查页面是否有实际的比赛数据结构
          return document.querySelector('div.loc_match_list') || 
                 document.querySelector('ul.item.play') ||
                 document.body.innerText.length > 1000; // 或者页面内容足够多
        }, { timeout: 30000 }).catch(() => {
          console.log('未找到预期的内容结构，继续尝试...');
        });
        
        // 再次等待确保内容完全加载
        await randomDelay(1000, 2000);
        
        content = await page.content();
        
        // 检查内容是否为重定向页面
        if (content.includes('getRL()') || content.includes('createElement("script")')) {
          console.log('检测到重定向页面，等待JavaScript执行...');
          
          // 等待更长时间让JavaScript重定向完成
          await page.waitForNavigation({ 
            waitUntil: ['networkidle2'], 
            timeout: 30000 
          }).catch(() => {
            console.log('导航超时，尝试获取当前页面内容');
          });
          
          await randomDelay(2000, 3000);
          content = await page.content();
        }
        
        // 验证内容是否有效
        if (content && content.length > 1000 && !content.includes('getRL()')) {
          console.log('成功获取页面内容');
          break;
        } else {
          throw new Error('获取的内容无效或仍为重定向页面');
        }
        
      } catch (error) {
        console.error(`第 ${6 - retries} 次尝试失败:`, error.message);
        retries--;
        if (retries > 0) {
          console.log(`等待后重试... (剩余 ${retries} 次)`);
          await randomDelay(3000, 6000); // 增加重试间隔
          
          // 创建新页面来避免状态污染
          await page.close();
          page = await browser.newPage();
          
          // 重新设置页面配置
          await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined,
            });
          });
          await page.setUserAgent(getRandomUserAgent());
          await page.setJavaScriptEnabled(true);
        }
      }
    }

    if (!content) {
      throw new Error('所有重试均失败，无法获取页面内容');
    }

    return cheerio.load(content);

  } catch (error) {
    console.error('增强版爬虫错误:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function fetchGamesDataEnhanced() {
  console.log('开始增强版游戏数据抓取...');
  try {
    const $ = await fetchHtmlAdvanced('http://www.jrskan.com/');

    // 先检查页面结构
    console.log('页面标题:', $('title').text());
    console.log('页面内容长度:', $.html().length);
    
    // 打印部分内容用于调试
    const bodyText = $('body').text();
    console.log('页面内容预览:', bodyText.substring(0, 200));

    const matchList = $('div.loc_match_list');
    console.log('找到比赛列表容器:', matchList.length);
    
    const matches = matchList.find('ul.item.play');
    console.log('找到比赛条目:', matches.length);
    
    const games = [];

    matches.each((index, element) => {
      const match = $(element);

      const league = match.find('li.lab_events span.name').text().trim();
      const gameTime = match.find('li.lab_time').text().trim();

      const team1 = match.find('li.lab_team_home strong.name').text().trim();
      const team1Score = match.find('li.lab_team_home em.bf').text().trim();
      const team1Logo = match
        .find('li.lab_team_home span.avatar img')
        .attr('src');

      const team2 = match.find('li.lab_team_away strong.name').text().trim();
      const team2Score = match.find('li.lab_team_away em.bf').text().trim();
      const team2Logo = match
        .find('li.lab_team_away span.avatar img')
        .attr('src');

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
        console.log(`解析比赛 ${index + 1}: ${team1} vs ${team2} (${league})`);
      }
    });

    console.log(`成功解析 ${games.length} 场比赛`);
    return games;
  } catch (error) {
    console.error('增强版数据抓取失败:', error);
    return []; // 返回空数组而不是undefined
  }
}

module.exports = fetchGamesDataEnhanced;