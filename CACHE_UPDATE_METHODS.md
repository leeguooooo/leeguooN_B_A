# 缓存更新方法汇总

## 1. GitHub Actions（每5分钟）
- **限制**：GitHub Actions 最小间隔是 5 分钟
- **优点**：完全免费，可靠
- **配置**：已在 `.github/workflows/update-cache.yml` 中配置

## 2. 免费监控服务（每分钟）

### UptimeRobot
1. 注册 https://uptimerobot.com（免费账户）
2. 添加新监控器：
   - 监控类型：HTTP(s)
   - URL：`https://your-app.vercel.app/api/webhook/update`
   - 监控间隔：1 分钟
   - HTTP 方法：POST
   - HTTP Headers：`X-Api-Key: your_api_key`

### Cron-job.org
1. 注册 https://cron-job.org（免费账户）
2. 创建新任务：
   - URL：`https://your-app.vercel.app/api/webhook/update`
   - 执行间隔：每分钟
   - 请求方法：POST
   - Headers：`X-Api-Key: your_api_key`

### Better Uptime
1. 注册 https://betteruptime.com（免费计划）
2. 创建心跳监控：
   - 每分钟触发一次
   - Webhook URL 指向更新接口

## 3. 客户端触发（实时）

在前端添加定时器，每分钟触发更新：

```javascript
// 在 App.vue 或主组件中
onMounted(() => {
  // 立即更新一次
  updateCache();
  
  // 每分钟更新
  setInterval(updateCache, 60000);
});

async function updateCache() {
  try {
    await fetch('/api/webhook/update', {
      method: 'POST',
      headers: {
        'X-Api-Key': import.meta.env.VITE_API_KEY
      }
    });
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}
```

## 4. Vercel Edge Functions（按需更新）

创建 Edge Function 在每次请求时检查缓存：

```javascript
// api/games-edge.js
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const lastUpdate = await getFromKV('games/jrs/last_update');
  const now = Date.now();
  
  // 如果超过1分钟，触发更新
  if (!lastUpdate || now - lastUpdate > 60000) {
    // 异步触发更新，不等待
    fetch(process.env.VERCEL_APP_URL + '/api/webhook/update', {
      method: 'POST',
      headers: { 'X-Api-Key': process.env.API_KEY }
    });
  }
  
  // 返回当前缓存的数据
  const games = await getFromKV('games/jrs/all');
  return Response.json(games);
}
```

## 推荐方案

1. **生产环境**：使用 UptimeRobot + GitHub Actions 双重保障
   - UptimeRobot 每分钟更新（主要）
   - GitHub Actions 每5分钟更新（备份）

2. **开发测试**：使用客户端触发
   - 方便调试
   - 实时更新

3. **高可用方案**：多个服务同时使用
   - 避免单点故障
   - 确保缓存及时更新