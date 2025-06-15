// 逆向工程网站的JavaScript重定向逻辑

function analyzeRedirectLogic() {
  console.log('🔍 分析JavaScript重定向逻辑...');
  
  // 模拟网站的getRL函数
  function getRL() {
    const date = new Date();
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    return month + day;
  }
  
  const zzSub = getRL();
  console.log('📅 当前日期标识:', zzSub);
  
  // 解码base64字符串
  const encodedDomain = "Lmh3My5ob25nOTEudG9w";
  const decodedDomain = Buffer.from(encodedDomain, 'base64').toString();
  console.log('🌐 解码后的域名:', decodedDomain);
  
  // 构造实际的API URL
  const originalUrl = "http://www.jrskan.com/";
  const encodedOriginalUrl = Buffer.from(originalUrl).toString('base64');
  console.log('🔗 编码后的原始URL:', encodedOriginalUrl);
  
  const actualApiUrl = `https://gn${zzSub}${decodedDomain}/api.2.JS?1,${encodedOriginalUrl}`;
  console.log('🎯 构造的实际API URL:', actualApiUrl);
  
  return {
    dateId: zzSub,
    decodedDomain,
    originalUrl,
    encodedOriginalUrl,
    actualApiUrl
  };
}

// 测试构造的URL
async function testConstructedUrl() {
  const axios = require('axios');
  
  const urlInfo = analyzeRedirectLogic();
  
  console.log('\n🚀 测试构造的URL...');
  
  try {
    const response = await axios.get(urlInfo.actualApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'http://www.jrskan.com/',
        'Origin': 'http://www.jrskan.com'
      },
      timeout: 10000
    });
    
    console.log('✅ 请求成功!');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应类型:', response.headers['content-type']);
    console.log('📝 响应长度:', response.data.length);
    console.log('🔍 响应内容预览:', response.data.substring(0, 500));
    
    return response.data;
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    console.log('🔧 尝试其他日期格式...');
    
    // 尝试不同的日期格式
    const alternatives = [
      `gn0${urlInfo.dateId}`,  // 前缀0
      `gn${urlInfo.dateId}0`,  // 后缀0
      `gn${new Date().getMonth()}${new Date().getDate()}`, // 不加1的月份
    ];
    
    for (const alt of alternatives) {
      const altUrl = `https://${alt}${urlInfo.decodedDomain}/api.2.JS?1,${urlInfo.encodedOriginalUrl}`;
      console.log('🔄 尝试:', altUrl);
      
      try {
        const altResponse = await axios.get(altUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          },
          timeout: 5000
        });
        
        console.log('✅ 替代URL成功!', altUrl);
        return altResponse.data;
        
      } catch (altError) {
        console.log('❌ 替代URL失败:', alt);
      }
    }
  }
  
  return null;
}

if (require.main === module) {
  testConstructedUrl()
    .then(result => {
      if (result) {
        console.log('\n🎉 成功获取数据!');
      } else {
        console.log('\n💀 所有尝试都失败了');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 脚本执行错误:', error);
      process.exit(1);
    });
}

module.exports = { analyzeRedirectLogic, testConstructedUrl };