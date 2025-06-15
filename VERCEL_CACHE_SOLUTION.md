# Vercel 缓存方案说明（免费账户版）

## 问题分析

在 Vercel serverless 环境下，传统的缓存方案存在以下问题：

1. **无状态函数**: 每次请求可能在不同实例执行，内存缓存无效
2. **执行时间限制**: 最多 30 秒，无法完成大量数据抓取和流解析
3. **无后台进程**: 不能运行传统的定时任务
4. **异步任务中断**: 函数响应后立即终止，异步更新不可靠
5. **免费账户限制**: Cron Jobs 有限制，需要替代方案

## 解决方案

### 1. 使用外部 KV 存储 (dokv.pwtk.cc)

**优点**:
- 持久化存储，跨函数实例共享
- 支持设置过期时间
- 简单的 HTTP API

**缓存 Key 结构**:
```
games/jrs/all        - 所有比赛数据
games/jrs/nba        - NBA 比赛数据
games/jrs/cba        - CBA 比赛数据
games/jrs/streams    - 流地址缓存
games/jrs/last_update - 最后更新时间戳
```

### 2. GitHub Actions 定时更新（免费方案）

**配置** (.github/workflows/update-cache.yml):
```yaml
on:
  schedule:
    - cron: '*/5 * * * *'  # 每5分钟执行
  workflow_dispatch: # 允许手动触发
```

**特点**:
- GitHub Actions 免费额度：每月 2000 分钟
- 通过 webhook 触发 Vercel 函数更新缓存
- 比 Vercel Cron Jobs 更灵活，完全免费

**计算**: 
- 每5分钟运行 = 每天 288 次
- 每次约 10 秒 = 每天 48 分钟
- 每月约 1440 分钟（在 2000 分钟免费额度内）

**Webhook 端点**: `/api/webhook/update`
- 需要 `X-Api-Key` 头验证
- 只更新游戏数据，不解析流地址

### 3. 分离数据抓取和流解析

**游戏数据**: 
- 通过 Cron Job 定时更新
- 缓存 5 分钟有效期
- 前端直接从 KV 读取

**流地址**:
- 按需解析，用户点击时实时获取
- 缓存 10 分钟有效期
- 通过 API 端点单独处理

### 4. 前端直连 KV 存储

**好处**:
- 减少 API 调用延迟
- 降低 serverless 函数调用成本
- 避免冷启动问题

**实现**:
```javascript
// src/services/kvApi.js
const response = await axios.get('https://dokv.pwtk.cc/kv/games/jrs/all');
```

## 环境变量配置

### Vercel Dashboard 中设置：

```bash
KV_AUTH_TOKEN=your_kv_auth_token     # KV 存储认证令牌
API_KEY=your_api_key                 # API 端点保护密钥
```

### GitHub Secrets 中设置：

```bash
VERCEL_APP_URL=https://your-app.vercel.app  # 你的 Vercel 应用 URL
API_KEY=your_api_key                        # 与 Vercel 中相同的 API Key
KV_BASE_URL=https://dokv.pwtk.cc/kv        # KV 存储基础 URL
```

## 缓存更新流程

1. **定时更新** (每5分钟):
   - GitHub Actions → `/api/webhook/update`
   - 抓取游戏数据 → 存储到 KV

2. **前端获取数据**:
   - 直接请求 KV API
   - 获取缓存的游戏列表

3. **流地址解析**:
   - 用户点击播放
   - API 实时解析或返回缓存
   - 缓存10分钟有效

## 监控和维护

1. **检查缓存状态**:
   ```bash
   curl https://dokv.pwtk.cc/kv/games/jrs/last_update
   ```

2. **手动触发更新**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/update-cache \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. **查看 Vercel 日志**:
   - Functions 标签页查看执行日志
   - Crons 标签页查看定时任务状态

## 注意事项

1. **Vercel Cron 限制**:
   - 免费版每天最多 2 个 cron jobs
   - 执行频率最高每小时一次
   - Pro 版可以更频繁执行

2. **KV 存储限制**:
   - 检查 dokv.pwtk.cc 的速率限制
   - 考虑备用 KV 服务

3. **降级方案**:
   - 如果 KV 不可用，直接调用 API 抓取
   - 设置合理的超时和重试机制

这个方案充分考虑了 Vercel 的限制，提供了可靠的缓存更新机制。