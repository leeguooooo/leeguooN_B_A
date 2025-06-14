#!/bin/bash

echo "Starting Vercel build process..."

# 安装依赖
echo "Installing dependencies..."
npm install

# 构建前端
echo "Building frontend with Vite..."
npm run build

# 确保构建输出存在
if [ -d "dist" ]; then
    echo "Build successful! Contents of dist:"
    ls -la dist/
else
    echo "Build failed! No dist directory found."
    exit 1
fi

echo "Build process completed!"