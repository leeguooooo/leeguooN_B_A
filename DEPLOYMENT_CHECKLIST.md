# 部署前检查清单 🚀

在推送代码到 GitHub（触发 Vercel 自动部署）之前，请确保完成以下检查：

## 自动检查

运行以下命令进行自动检查：

```bash
# 运行所有检查
npm run check:all

# 或分别运行
npm run check        # 基础检查
npm run build:check  # 构建检查
```

## 手动检查清单

### 1. 依赖管理 📦
- [ ] 运行 `pnpm install` 确保 lockfile 是最新的
- [ ] 确保 `terser` 在 `dependencies` 而不是 `devDependencies`
- [ ] 检查是否有未使用的依赖：`npx depcheck`

### 2. 环境变量 🔐
在 Vercel Dashboard 中确认以下环境变量已设置：
- [ ] `API_KEY` - API 访问密钥
- [ ] `KV_AUTH_TOKEN` - KV 存储认证令牌
- [ ] `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` - 设置为 `true`

### 3. 代码质量 ✨
- [ ] 没有 `console.log` 在生产代码中（除了必要的日志）
- [ ] 没有硬编码的密钥或敏感信息
- [ ] API 端点都有错误处理

### 4. 功能测试 🧪
- [ ] 本地运行 `npm run dev` 测试主要功能
- [ ] 测试直播源解析是否正常
- [ ] 测试数据更新功能

### 5. 性能检查 ⚡
- [ ] 检查构建大小：`npm run build` 后查看 dist 目录
- [ ] 确保没有过大的依赖包

## 常见问题解决

### 1. pnpm-lock.yaml 不同步
```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "Update pnpm lockfile"
```

### 2. terser 错误
确保 `terser` 在 package.json 的 `dependencies` 中：
```json
"dependencies": {
  "terser": "^5.42.0",
  ...
}
```

### 3. 构建失败
```bash
# 清理缓存
rm -rf node_modules
rm -rf dist
pnpm install
npm run build
```

## 部署流程

1. 运行检查：`npm run check:all`
2. 提交代码：`git add . && git commit -m "your message"`
3. 推送到 GitHub：`git push origin main`
4. 在 Vercel Dashboard 监控部署状态
5. 部署完成后测试线上功能

## 回滚方案

如果部署后出现问题：
1. 在 Vercel Dashboard 中找到上一个成功的部署
2. 点击 "..." → "Promote to Production"
3. 或使用 Git 回滚：`git revert HEAD && git push`