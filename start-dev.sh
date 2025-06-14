#!/bin/bash

echo "🚀 启动开发环境..."

# 启动后端服务器
echo "📦 启动后端服务器 (端口 3000)..."
node app.js &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口 5173)..."
pnpm dev &
FRONTEND_PID=$!

echo "✅ 开发环境已启动!"
echo "   - 前端: http://localhost:5173"
echo "   - 后端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 捕获退出信号
trap "echo '🛑 停止所有服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# 等待进程
wait