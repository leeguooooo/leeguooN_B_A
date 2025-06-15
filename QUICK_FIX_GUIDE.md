# 快速修复指南 - 数据更新问题

## 问题诊断

当前问题：
- KV存储中的数据是6月13日的旧数据
- 前端显示"暂无比赛数据"
- 需要 KV_AUTH_TOKEN 才能更新数据

## 解决方案

### 方案1：使用本地API（推荐，已配置）

✅ **已经为您配置好了！**

1. 确保本地API正在运行：
   ```bash
   node app.js
   ```

2. `.env` 文件已配置使用本地API：
   ```
   VITE_USE_LOCAL_API=true
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. 重启开发服务器（已完成）

现在访问 http://localhost:5173 应该能看到今天的比赛数据了！

### 方案2：更新KV存储

如果您有 KV_AUTH_TOKEN：

1. 访问：http://localhost:5173/kv-update.html
2. 输入您的 KV Auth Token
3. 选择"从本地API获取"
4. 点击"预览数据"确认数据正确
5. 点击"更新到KV"

### 方案3：切换回KV模式

如果KV已更新，想切换回使用KV：

1. 编辑 `.env` 文件：
   ```
   VITE_USE_LOCAL_API=false
   ```

2. 重启开发服务器：
   ```bash
   npm run dev
   ```

## 数据状态检查

- 本地API数据：http://localhost:3000/api/games
- KV数据状态：https://dokv.pwtk.cc/kv/games/jrs/last_update
- KV游戏数据：https://dokv.pwtk.cc/kv/games/jrs/all

## 注意事项

1. 本地API的数据是实时的，每次请求都会重新抓取
2. KV存储的数据需要手动更新或通过定时任务更新
3. 生产环境应该使用KV存储以减少服务器负载