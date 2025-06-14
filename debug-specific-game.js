const getFullIframeSrc = require('./decode_url.js');

async function debugSpecificGame() {
  const testUrl = 'http://m.sportsteam586.com/play/steam793873.html'; // 戈梅利 vs 捷尔任斯克兵工厂
  
  console.log('🔍 调试特定比赛解析过程:');
  console.log('📡 测试URL:', testUrl);
  console.log('🎯 期望比赛: 戈梅利 vs 捷尔任斯克兵工厂');
  console.log('✅ 期望流ID: 60453007 (hdl6.szsummer.cn)');
  console.log('❌ 实际流ID: 18836211 (hdl7.szsummer.cn)');
  console.log('');
  
  try {
    const result = await getFullIframeSrc(testUrl);
    console.log('📋 解析结果:', result);
    
    // 分析结果
    if (result) {
      if (result.includes('livehwc4.com')) {
        console.log('⚠️  问题确认: 获取了CDN代理地址而非原始流');
      }
      
      if (result.includes('18836211')) {
        console.log('⚠️  流ID问题: 获取了错误的流ID');
      }
      
      if (result.includes('60453007')) {
        console.log('✅ 流ID正确: 获取了期望的流ID');
      }
      
      // 提取参数分析
      const urlObj = new URL(result);
      console.log('📊 URL分析:');
      console.log('   - 域名:', urlObj.hostname);
      console.log('   - 路径:', urlObj.pathname);
      console.log('   - 参数:', Object.fromEntries(urlObj.searchParams));
    }
    
  } catch (error) {
    console.error('❌ 解析失败:', error.message);
  }
}

debugSpecificGame();