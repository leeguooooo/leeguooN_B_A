const { getDynamicContent } = require('./fetchHtml');
const { URL } = require('url'); // 引入URL模块

async function getFullIframeSrc(url) {
  try {
    const htmlString = await getDynamicContent(url);

    console.log(htmlString);

    // 提取 encodedStr
    const encodedStrMatch = htmlString.match(/var encodedStr = '([^']+)'/);
    if (!encodedStrMatch) {
      throw new Error('无法找到 encodedStr 的值');
    }
    const encodedStr = encodedStrMatch[1]; // 正确获取捕获组的内容

    var regex = /src=\\x27(.*?)='/;
    var match = htmlString.match(regex);
    var parsedUrl;
    if (match) {
      parsedUrl = match[1]; // 第一个捕获组是 URL
      console.log(parsedUrl); // 输出: //cloud.yumixiu768.com/player/pap.html?id=abc123
    } else {
      console.log('未找到 src 属性');
    }

    // 拼接完整URL
    const fullUrl = parsedUrl + '=' + encodedStr; // 拼接完整URL

    console.log('完整的iframe src地址:', fullUrl);

    return fullUrl;
  } catch (error) {
    console.error('解析iframe地址时出错:', error.message);
    throw error;
  }
}

module.exports = getFullIframeSrc;
