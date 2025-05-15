
# 解决 Vercel 上 Puppeteer 的 libnss3.so 错误

## 问题分析

在 Vercel 环境中运行 Puppeteer 时出现的错误：
```
/tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

这是因为 Vercel 无服务器环境缺少 Chromium 所需的系统库。

## 解决方案

通过查看 package.json，可以看到已经安装了 `@sparticuz/chromium` 和 `puppeteer-core`，这是正确的方向。现在需要确保正确初始化浏览器。

### 1. 创建浏览器初始化工具函数

创建一个 `utils/browser.js` 文件：

```javascript
const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

async function getBrowser() {
  const isProduction = process.env.VERCEL_ENV === "production";
  
  if (isProduction) {
    const browser = await puppeteerCore.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    return browser;
  } else {
    // 本地开发环境使用
    const puppeteer = require('puppeteer');
    return await puppeteer.launch();
  }
}

module.exports = { getBrowser };
```

### 2. 修改使用 Puppeteer 的代码

替换当前的 Puppeteer 初始化代码，使用新的工具函数：

```javascript
const { getBrowser } = require('./utils/browser');

// 示例用法
async function scrapeData() {
  const browser = await getBrowser();
  
  try {
    const page = await browser.newPage();
    await page.goto("https://example.com");
    
    // 执行爬取操作...
    
    return data;
  } finally {
    await browser.close();
  }
}
```

### 3. 创建或更新 vercel.json

```json
{
  "functions": {
    "api/**/*": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### 4. 确保正确环境变量设置

确认在 Vercel 控制面板设置了必要的环境变量。

## 其他注意事项

1. 首次冷启动会很慢，因为需要下载 Chromium
2. 监控内存使用情况，必要时增加分配
3. 考虑实现缓存层以提高性能
4. 如果仍然遇到问题，可以考虑使用外部 Puppeteer 服务或容器化方案
