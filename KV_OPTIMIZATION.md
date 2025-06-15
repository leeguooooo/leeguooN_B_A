# KV 优化策略

## 目标
尽量使用 KV 存储来减轻服务器压力，即使用户量很大也不会影响服务性能。

## 已实现的 KV 使用

### 1. 游戏数据
- **KV Key**: `games/jrs/all`
- **更新频率**: 每 5 分钟（GitHub Actions）
- **使用场景**: 所有比赛列表

### 2. 更新时间
- **KV Key**: `games/jrs/last_update`
- **更新频率**: 随游戏数据更新
- **使用场景**: 显示数据新鲜度

### 3. 分类数据（可选）
- **KV Key**: `games/jrs/nba`, `games/jrs/cba`
- **更新频率**: 随游戏数据更新
- **使用场景**: 按联赛筛选

## 可以优化的部分

### 1. 直播链接缓存
```javascript
// KV Key 格式: live_links_{encodedUrl}
// 缓存时间: 30 分钟
// 好处: 减少实时解析压力
```

### 2. 流地址缓存
```javascript
// KV Key 格式: stream_url_{encodedUrl}
// 缓存时间: 2 小时
// 好处: 热门比赛不需要重复解析
```

### 3. 预解析策略
- 在数据更新时，预解析热门比赛的直播源
- 优先解析：
  - 正在进行的比赛
  - 即将开始的比赛（2小时内）
  - 热门联赛（NBA、英超等）

## 实施计划

### 第一阶段：优化前端调用
- [x] 修改 `fetchLiveLinks` 优先使用 KV 缓存
- [x] 修改 `getStreamUrl` 优先使用 KV 缓存
- [ ] 添加缓存未命中时的写入逻辑

### 第二阶段：后端预解析
- [ ] 在 webhook 更新时预解析热门比赛
- [ ] 创建独立的预解析任务
- [ ] 设置合理的缓存过期时间

### 第三阶段：监控和优化
- [ ] 添加缓存命中率统计
- [ ] 根据使用情况调整预解析策略
- [ ] 优化缓存 Key 结构

## 注意事项

1. **实时性要求**: 直播源可能会变化，缓存时间不宜过长
2. **存储限制**: KV 存储有容量限制，需要合理规划
3. **降级策略**: KV 获取失败时，要能降级到实时解析

## 代码示例

```javascript
// 前端使用 KV 的标准模式
async function fetchWithKVCache(kvKey, fallbackFn) {
  try {
    // 1. 尝试从 KV 获取
    const cached = await kvApi.get(kvKey)
    if (cached) {
      console.log(`KV 命中: ${kvKey}`)
      return cached
    }
    
    // 2. KV 未命中，执行原函数
    console.log(`KV 未命中: ${kvKey}`)
    const result = await fallbackFn()
    
    // 3. TODO: 写入 KV 缓存
    // await kvApi.set(kvKey, result, ttl)
    
    return result
  } catch (error) {
    // 4. 降级到原函数
    console.error('KV 访问失败，降级处理', error)
    return fallbackFn()
  }
}
```