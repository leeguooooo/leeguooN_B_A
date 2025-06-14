# 体育直播平台 Sports Live Streaming Platform

一个现代化的体育赛事直播聚合平台，支持多平台观看。

## 功能特点

- 🏀 **多赛事支持**：NBA、CBA、英超、西甲等主流体育赛事
- 📺 **多线路选择**：智能推荐最佳观看线路
- 🎯 **高清画质**：支持4K超清、1080P高清等多种画质
- 📱 **多端适配**：支持PC、移动端、Apple TV
- 🌙 **暗黑模式**：保护眼睛，夜间观看更舒适
- ⚡ **实时更新**：赛事信息实时同步

## 技术栈

### 前端
- Vue 3 + Composition API
- Vite 构建工具
- Tailwind CSS + DaisyUI
- HLS.js 视频播放
- Pinia 状态管理

### 后端
- Node.js + Express
- Puppeteer 网页爬虫
- Cheerio HTML解析
- Axios HTTP请求

### 部署
- Vercel Serverless Functions
- Docker 容器化支持

## 快速开始

### 环境要求
- Node.js 18.x
- pnpm 或 npm

### 安装依赖
```bash
pnpm install
# 或
npm install
```

### 开发模式
```bash
# 启动前端开发服务器
pnpm dev

# 启动后端服务器
pnpm start
```

### 构建部署
```bash
# 构建前端
pnpm build

# Docker 部署
docker build -t sports-live .
docker run -p 3000:3000 sports-live
```

### 环境变量
复制 `.env.example` 到 `.env` 并配置：
```
API_KEY=your_api_key_here
PORT=3000
```

## 项目结构

```
├── src/                # Vue 前端源码
│   ├── views/         # 页面组件
│   ├── components/    # 通用组件
│   ├── stores/        # Pinia 状态管理
│   └── router.js      # 路由配置
├── app.js             # Express 服务器
├── api/               # Serverless functions
├── public/            # 静态资源
└── vercel.json        # Vercel 配置
```

## API 接口

- `GET /api/games` - 获取比赛列表
- `GET /api/parseLiveLinks` - 解析直播链接
- `GET /api/getStreamUrl` - 获取流媒体地址
- `GET /proxy/m3u8` - M3U8 代理（绕过CORS）
- `GET /proxy/iframe` - 页面代理

## 贡献指南

欢迎提交 Pull Request 或创建 Issue。

## 许可证

ISC License

## 声明

本项目仅供学习交流使用，请勿用于商业用途。所有直播内容版权归原作者所有。
EOF < /dev/null