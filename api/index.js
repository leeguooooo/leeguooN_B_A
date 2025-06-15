// Vercel Serverless Function 入口
const app = require('../app');

// 添加健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      frontend: 'Vue 3 + Vite',
      ui: 'Tailwind CSS + DaisyUI',
      player: 'HLS.js',
      deployment: 'Vercel'
    }
  });
});

module.exports = app;