// M3U8 代理 API
const proxyM3U8 = require('../../m3u8-proxy');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await proxyM3U8(req, res);
}

export const config = {
  maxDuration: 30
};