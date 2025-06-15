// Vercel Serverless Function - Health Check
export default function handler(req, res) {
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
}