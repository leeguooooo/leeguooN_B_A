# GitHub Secrets 配置说明

为了让 GitHub Actions 正常工作，您需要在 GitHub 仓库中添加以下 Secrets：

## 1. 进入 GitHub 仓库设置

1. 访问您的仓库：https://github.com/leeguooooo/leeguooN_B_A
2. 点击 "Settings" (设置)
3. 在左侧菜单找到 "Secrets and variables" -> "Actions"
4. 点击 "New repository secret"

## 2. 添加以下 Secrets

### VERCEL_APP_URL
- **Name**: `VERCEL_APP_URL`
- **Value**: 您的 Vercel 应用 URL（例如：`https://leeguoo-app.vercel.app`）
- 注意：不要在末尾加斜杠

### API_KEY
- **Name**: `API_KEY`
- **Value**: 您在 Vercel 环境变量中设置的相同 API_KEY
- 这个密钥用于验证 webhook 请求

## 3. 验证配置

添加完成后，您可以：

1. 手动触发 workflow 测试：
   - 进入 Actions 标签页
   - 找到 "Update Cache" workflow
   - 点击 "Run workflow"

2. 检查执行日志确认是否成功

## 示例值

```
VERCEL_APP_URL: https://your-app-name.vercel.app
API_KEY: your-secure-api-key-here
```

## 注意事项

- 确保 VERCEL_APP_URL 是您实际的 Vercel 部署 URL
- API_KEY 必须与 Vercel 环境变量中的值完全一致
- 不要在 URL 末尾添加斜杠