# KV存储问题诊断和解决方案

## 发现的问题

### 1. KV数据过期
- **当前状态**: KV中的数据是6月13日的比赛，已经过期
- **最后更新时间**: 1749845118988 (时间戳格式)
- **数据示例**: 拉脱超、罗篮甲等比赛，都是06-13的

### 2. KV存储需要授权
- **错误信息**: `Authorization header required` (401错误)
- **原因**: dokv.pwtk.cc 的KV存储需要授权令牌才能写入
- **读取权限**: 可以正常读取，不需要授权

### 3. 前端代码配置正确
- **API地址**: `https://dokv.pwtk.cc/kv/games/jrs/all`
- **前端调用**: 正确使用了 kvApi.getGames() 方法
- **数据过滤**: 前端会过滤掉过期的比赛（只显示今天及以后的）

## 解决方案

### 方案1: 获取KV授权令牌
1. 联系 dokv.pwtk.cc 的管理员获取授权令牌
2. 在环境变量中配置 `KV_AUTH_TOKEN`
3. 修改更新脚本添加授权头:
   ```javascript
   headers: {
     'Authorization': `Bearer ${process.env.KV_AUTH_TOKEN}`,
     'Content-Type': 'application/json'
   }
   ```

### 方案2: 使用现有的更新机制
1. 通过 Vercel API 触发更新:
   ```bash
   curl -X POST https://nba.leeguoo.com/api/updateGames \
     -H "X-Api-Key: kuaikuaishiyongshuangjiegunheiheihahei"
   ```

2. 检查 Vercel 函数是否正确配置了KV更新逻辑

### 方案3: 临时使用本地API
1. 修改前端代码暂时使用本地API而不是KV:
   ```javascript
   // 在 src/stores/games.js 中
   const response = await axios.get('/api/games')
   ```

2. 确保本地API服务运行正常

## 建议的操作步骤

1. **立即**: 检查 Vercel 部署的 `/api/updateGames` 端点是否工作正常
2. **立即**: 如果有KV授权令牌，配置到环境变量中
3. **短期**: 设置定时任务自动更新KV数据
4. **长期**: 考虑使用更可靠的数据存储方案（如 Vercel KV、Redis等）

## 测试脚本

已创建以下测试脚本：
- `test-kv-update.js`: 尝试使用真实数据更新KV
- `test-kv-update.cjs`: CommonJS版本
- `test-kv-mock-update.js`: 使用模拟数据测试KV更新

运行测试：
```bash
# 测试模拟数据更新（需要配置KV_AUTH_TOKEN）
KV_AUTH_TOKEN=your-token-here node test-kv-mock-update.js
```