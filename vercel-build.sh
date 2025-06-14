#!/bin/bash
echo "=== Vercel Build Debug ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo ""
echo "=== Directory structure ==="
ls -la
echo ""
echo "=== src directory ==="
ls -la src/
echo ""
echo "=== Running build ==="
pnpm run build