const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// 发布页地址
const PUBLISH_PAGE_URL = 'https://www.qiumi1314.com/';

// Vercel配置
const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_TEAM_ID;  // 如果项目不属于团队，可以省略

// 从发布页获取最新URL
async function getLatestUrl() {
  console.log('Fetching latest URL from publish page...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(PUBLISH_PAGE_URL, { waitUntil: 'domcontentloaded' });
    
    // 等待页面内容加载
    await page.waitForSelector('ul, li a, a');
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // 查找页面上标记为最近更新的链接
    let latestUrl = null;
    
    // 查找日期文本
    const recentDateTexts = $('body').text().match(/\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/g);
    if (recentDateTexts && recentDateTexts.length > 0) {
      // 排序日期，最近的日期优先
      const sortedDates = [...recentDateTexts].sort((a, b) => {
        return new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-'));
      });
      
      // 查找包含最近日期附近的链接
      for (const dateText of sortedDates) {
        const dateArea = $(`*:contains("${dateText}")`).first().parent();
        const links = dateArea.find('a[href]');
        if (links.length === 0) {
          // 如果没有找到链接，尝试寻找文本中的域名
          const potentialUrls = dateArea.text().match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.)*jrs[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net)/g);
          if (potentialUrls && potentialUrls.length > 0) {
            latestUrl = `http://${potentialUrls[0]}`;
            break;
          }
        } else {
          latestUrl = links.first().attr('href');
          if (latestUrl) break;
        }
      }
    }
    
    // 如果没找到更新日期，找所有可能的域名
    if (!latestUrl) {
      // 查找页面上所有 a 标签中包含 jrs 的链接
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('jrs') && (href.includes('.com') || href.includes('.net'))) {
          latestUrl = href;
          return false; // 找到一个就跳出
        }
      });
      
      // 如果还没找到，尝试从文本中提取
      if (!latestUrl) {
        const potentialUrls = $('body').text().match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.)*jrs[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net)/g);
        if (potentialUrls && potentialUrls.length > 0) {
          latestUrl = `http://${potentialUrls[0]}`;
        }
      }
    }
    
    // 确保URL格式正确
    if (latestUrl) {
      if (!latestUrl.startsWith('http')) {
        latestUrl = `http://${latestUrl}`;
      }
      console.log(`Found latest URL: ${latestUrl}`);
      return latestUrl;
    }
    
    // 如果所有方法都失败，返回默认URL
    console.log('Could not find a valid URL, using default');
    return 'http://www.jrskan.com/';
    
  } catch (error) {
    console.error('Error fetching latest URL:', error);
    return 'http://www.jrskan.com/';
  } finally {
    await browser.close();
  }
}

// 更新Vercel环境变量
async function updateVercelEnvVar(name, value) {
  const apiUrl = teamId 
    ? `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectId}/env`;
  
  try {
    // 先检查变量是否已存在
    const getResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const envVars = await getResponse.json();
    if (!getResponse.ok) {
      throw new Error(`Failed to get env vars: ${JSON.stringify(envVars)}`);
    }
    
    // 查找是否已存在该变量
    const existingVar = envVars.envs.find(env => env.key === name);
    const method = existingVar ? 'PATCH' : 'POST';
    const url = existingVar 
      ? `${apiUrl}/${existingVar.id}`
      : apiUrl;
    
    const data = {
      key: name,
      value: value,
      target: ['production', 'preview']
    };
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to update env var: ${JSON.stringify(result)}`);
    }
    
    console.log(`Successfully ${method === 'PATCH' ? 'updated' : 'created'} env var: ${name}`);
    return result;
  } catch (error) {
    console.error(`Error updating env var ${name}:`, error);
    throw error;
  }
}

// 执行更新
async function run() {
  try {
    // 获取最新URL
    const latestUrl = await getLatestUrl();
    const timestamp = Date.now();
    
    // 更新环境变量
    await updateVercelEnvVar('CACHED_URL', latestUrl);
    await updateVercelEnvVar('CACHED_TIMESTAMP', timestamp.toString());
    
    console.log('Environment variables updated successfully');
  } catch (error) {
    console.error('Failed to update environment variables:', error);
    process.exit(1);
  }
}

run();
