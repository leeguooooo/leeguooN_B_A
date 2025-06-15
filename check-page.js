const puppeteer = require('puppeteer');

async function checkPage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 设置移动端视口
  await page.setViewport({ width: 375, height: 667 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // 等待页面加载
  await page.waitForTimeout(2000);
  
  // 获取所有按钮的类
  const buttonClasses = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).map(btn => ({
      text: btn.textContent.trim(),
      classes: btn.className
    }));
  });
  
  console.log('按钮类名:');
  buttonClasses.forEach(btn => {
    console.log(`- "${btn.text}": ${btn.classes}`);
  });
  
  // 检查是否有 sm: 响应式类
  const hasResponsive = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    let found = false;
    allElements.forEach(el => {
      if (el.className && el.className.includes && el.className.includes('sm:')) {
        found = true;
      }
    });
    return found;
  });
  
  console.log('\n是否包含响应式类 (sm:):', hasResponsive);
  
  // 获取第一个游戏卡片的内容
  const gameCard = await page.evaluate(() => {
    const card = document.querySelector('.card');
    return card ? card.innerHTML.substring(0, 200) : '未找到游戏卡片';
  });
  
  console.log('\n游戏卡片内容预览:');
  console.log(gameCard + '...');
  
  await browser.close();
}

checkPage().catch(console.error);