#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Running pre-push checks...${NC}\n"

# 1. 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# 2. 构建项目
echo -e "${YELLOW}📦 Building project...${NC}"
if ! npm run build > /dev/null 2>&1; then
    echo -e "${RED}❌ Build failed! Please fix build errors before pushing.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# 3. 启动服务器
echo -e "${YELLOW}🚀 Starting local server for testing...${NC}"
npm start > /dev/null 2>&1 &
SERVER_PID=$!

# 等待服务器启动
sleep 5

# 检查服务器是否启动成功
if ! curl -s http://localhost:3000/ > /dev/null; then
    echo -e "${RED}❌ Failed to start server${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# 4. 运行 API 测试
echo -e "${YELLOW}🧪 Running API tests...${NC}"
if node api-tests.js; then
    TEST_RESULT=0
else
    TEST_RESULT=1
fi

# 5. 清理 - 停止服务器
echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

# 6. 检查测试结果
if [ $TEST_RESULT -ne 0 ]; then
    echo -e "${RED}\n❌ Tests failed! Push aborted.${NC}"
    echo -e "${YELLOW}💡 Fix the failing tests before pushing to GitHub.${NC}"
    exit 1
fi

# 7. 所有检查通过
echo -e "${GREEN}\n✅ All checks passed! Pushing to GitHub...${NC}\n"

# 执行推送
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}\n🎉 Successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}\n❌ Push failed!${NC}"
    exit 1
fi