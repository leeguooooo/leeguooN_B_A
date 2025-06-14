const { getDynamicContent } = require('./fetchHtml');
const { URL } = require('url'); // 引入URL模块

async function getFullIframeSrc(url) {
  try {
    console.log('开始解析URL:', url);
    
    // 特殊处理 i11.html 格式
    if (url.includes('/i11.html')) {
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get('id');
      if (id) {
        // 对于i11.html，直接构造流地址
        const streamUrl = `https://hdl7.szsummer.cn/live/${id}.m3u8`;
        console.log('i11.html格式，直接返回流地址:', streamUrl);
        return streamUrl;
      }
    }
    
    // 特殊处理 kbs.html 格式
    if (url.includes('/kbs.html')) {
      console.log('kbs.html格式需要特殊处理');
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get('id');
      
      if (id) {
        const htmlString = await getDynamicContent(url);
        
        // 查找动态iframe
        const iframeMatch = htmlString.match(/iframe.*?src=['"]([^'"]+)['"]/i);
        if (iframeMatch) {
          let iframeSrc = iframeMatch[1];
          
          // 替换动态id
          if (iframeSrc.includes('"+id+"')) {
            iframeSrc = iframeSrc.replace('"+id+"', id);
          }
          
          // 构造完整URL
          const baseUrl = url.split('/').slice(0, 3).join('/');
          const fullUrl = iframeSrc.startsWith('/') ? baseUrl + iframeSrc : iframeSrc;
          
          console.log('kbs.html解析的iframe URL:', fullUrl);
          
          // 如果最终URL还包含动态变量，说明解析失败
          if (fullUrl.includes('"+') || fullUrl.includes('+"')) {
            console.error('URL包含未解析的动态变量:', fullUrl);
            throw new Error('无法解析动态URL');
          }
          
          // 递归解析iframe内容
          return await getFullIframeSrc(fullUrl);
        }
      }
      
      throw new Error('无法解析kbs.html格式');
    }
    
    // 特殊处理 pao.php 格式
    if (url.includes('/pao.php')) {
      console.log('pao.php格式需要特殊处理');
      const htmlString = await getDynamicContent(url);
      
      // 查找 encodedStr 变量
      const encodedStrMatch = htmlString.match(/var encodedStr = '([^']+)'/);
      if (encodedStrMatch) {
        const encodedStr = encodedStrMatch[1];
        
        // pao.php 生成的是 pap.html 格式的URL
        const iframeUrl = `//cloud.yumixiu768.com/player/pap.html?id=${encodedStr}`;
        const fullUrl = 'http:' + iframeUrl;
        
        console.log('pao.php解析的iframe URL:', fullUrl);
        
        // 递归解析pap.html内容
        return await getFullIframeSrc(fullUrl);
      }
      
      throw new Error('无法解析pao.php格式');
    }
    
    const htmlString = await getDynamicContent(url);
    console.log('第一步获取HTML内容，长度:', htmlString.length);

    // 方式1: 查找 encodedStr (原始方式)
    const encodedStrMatch = htmlString.match(/var encodedStr = '([^']+)'/);
    if (encodedStrMatch) {
      const encodedStr = encodedStrMatch[1];
      
      var regex = /src=\\x27(.*?)='/;
      var match = htmlString.match(regex);
      var parsedUrl;
      if (match) {
        parsedUrl = match[1];
        console.log('找到原始格式:', parsedUrl);
        const fullUrl = parsedUrl + '=' + encodedStr;
        console.log('完整的iframe src地址:', fullUrl);
        return fullUrl;
      }
    }

    // 方式2: 解析动态生成的iframe (新格式 - 两步解析)
    const id1Match = htmlString.match(/var id1 = getQueryVariable\("id"\)/);
    if (id1Match) {
      // 从原始URL中提取id参数
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get('id');
      if (id) {
        const baseUrl = url.split('/').slice(0, 3).join('/');
        const iframeUrl = `${baseUrl}/play/${id}.html`;
        console.log('找到第一级iframe路径，id:', id, '-> URL:', iframeUrl);
        
        // 第二步：获取真正的流媒体页面
        const secondHtml = await getDynamicContent(iframeUrl);
        console.log('第二步获取HTML内容，长度:', secondHtml.length);
        
        // 解析真正的流媒体iframe src
        const streamSrcMatch = secondHtml.match(/src=['"]([^'"]+)['"]/);
        if (streamSrcMatch) {
          let streamUrl = streamSrcMatch[1];
          console.log('找到流媒体src:', streamUrl);
          
          // 处理相对路径
          if (streamUrl.startsWith('//')) {
            streamUrl = 'http:' + streamUrl;
          } else if (streamUrl.startsWith('/')) {
            streamUrl = baseUrl + streamUrl;
          }
          
          // 如果是 msss.html，提取其中的 m3u8 地址
          if (streamUrl.includes('msss.html')) {
            const urlObj = new URL(streamUrl);
            const id = urlObj.searchParams.get('id');
            if (id && id.includes('.m3u8')) {
              let m3u8Url = id;
              if (m3u8Url.startsWith('//')) {
                m3u8Url = 'https:' + m3u8Url;
              } else if (m3u8Url.startsWith('/')) {
                m3u8Url = 'https://hdl7.szsummer.cn' + m3u8Url;
              }
              console.log('提取的m3u8地址:', m3u8Url);
              return m3u8Url;
            }
          }
          
          console.log('最终流媒体地址:', streamUrl);
          return streamUrl;
        }
      }
    }

    // 方式3: 查找iframe src属性 (静态格式)
    const iframeSrcMatch = htmlString.match(/src='\/play\/([^']+)'/);
    if (iframeSrcMatch) {
      const srcPath = iframeSrcMatch[1];
      console.log('找到iframe src路径:', srcPath);
      
      const baseUrl = url.split('/').slice(0, 3).join('/');
      const fullUrl = `${baseUrl}/play/${srcPath}`;
      console.log('完整的iframe src地址:', fullUrl);
      return fullUrl;
    }

    // 方式4: 查找iframe标签的src属性 (更精确的匹配)
    const iframeMatch = htmlString.match(/<iframe[^>]+src=['"]([^'"]+)['"]/i);
    if (iframeMatch) {
      let srcUrl = iframeMatch[1];
      console.log('找到iframe src:', srcUrl);
      
      // 检查是否是sm.html格式 (需要两步解析)
      if (srcUrl.includes('/play/sm.html')) {
        const baseUrl = url.split('/').slice(0, 3).join('/');
        const fullSrcUrl = srcUrl.startsWith('/') ? baseUrl + srcUrl : srcUrl;
        console.log('发现sm.html格式，进行两步解析:', fullSrcUrl);
        
        // 第二步：获取真正的流媒体页面
        const secondHtml = await getDynamicContent(fullSrcUrl);
        console.log('第二步获取HTML内容，长度:', secondHtml.length);
        
        // 解析动态生成的iframe (JavaScript生成)
        const dynamicIframeMatch = secondHtml.match(/src=['"]\/play\/['"]\+id1\+['"]\.html['"]/);
        if (dynamicIframeMatch) {
          // 从第二步URL中提取id参数
          const secondUrlObj = new URL(fullSrcUrl);
          const id1 = secondUrlObj.searchParams.get('id');
          if (id1) {
            const dynamicSrc = `/play/${id1}.html`;
            const finalUrl = baseUrl + dynamicSrc;
            console.log('找到动态生成的iframe src:', dynamicSrc, '-> URL:', finalUrl);
            
            // 第三步：获取最终的流媒体页面
            const thirdHtml = await getDynamicContent(finalUrl);
            console.log('第三步获取HTML内容，长度:', thirdHtml.length);
            
            // 解析最终的iframe src
            const finalSrcMatch = thirdHtml.match(/<iframe[^>]+src=['"]([^'"]+)['"]/i);
            if (finalSrcMatch) {
              let finalStreamUrl = finalSrcMatch[1];
              console.log('找到最终流媒体src:', finalStreamUrl);
              
              // 处理相对路径
              if (finalStreamUrl.startsWith('//')) {
                finalStreamUrl = 'https:' + finalStreamUrl;
              } else if (finalStreamUrl.startsWith('/')) {
                finalStreamUrl = baseUrl + finalStreamUrl;
              }
              
              console.log('最终流媒体地址:', finalStreamUrl);
              return finalStreamUrl;
            }
          }
        }
        
        // 备用：解析静态iframe src
        const streamSrcMatch = secondHtml.match(/<iframe[^>]+src=['"]([^'"]+)['"]/i);
        if (streamSrcMatch) {
          let streamUrl = streamSrcMatch[1];
          console.log('找到静态流媒体src:', streamUrl);
          
          // 处理相对路径
          if (streamUrl.startsWith('//')) {
            streamUrl = 'https:' + streamUrl;
          } else if (streamUrl.startsWith('/')) {
            streamUrl = baseUrl + streamUrl;
          }
          
          console.log('最终流媒体地址:', streamUrl);
          return streamUrl;
        }
      } else {
        // 直接的iframe src
        if (srcUrl.startsWith('/')) {
          const baseUrl = url.split('/').slice(0, 3).join('/');
          srcUrl = baseUrl + srcUrl;
        } else if (srcUrl.startsWith('//')) {
          srcUrl = 'https:' + srcUrl;
        }
        
        console.log('完整的iframe src地址:', srcUrl);
        return srcUrl;
      }
    }

    throw new Error('无法找到有效的iframe src地址');
  } catch (error) {
    console.error('解析iframe地址时出错:', error.message);
    throw error;
  }
}

module.exports = getFullIframeSrc;
