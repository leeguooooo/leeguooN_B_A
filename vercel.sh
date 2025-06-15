#!/bin/bash

# 检查是否在 Vercel 环境中
if [ "$VERCEL" = "1" ]; then
  echo "Installing Chrome dependencies..."
  apt-get update
  apt-get install -y $(cat aptfile)
else
  echo "Local environment, skipping Chrome dependencies installation"
fi

# 设置 NODE_ENV
export NODE_ENV=production

# Install puppeteer dependencies
apt-get update -y
apt-get install -y libx11-xcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libnss3 libasound2 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libxrandr2 libdrm2 libgbm1
