#!/bin/bash
echo "Current directory: $(pwd)"
echo "Checking if src/main.js exists:"
if [ -f "src/main.js" ]; then
    echo "✓ src/main.js exists"
else
    echo "✗ src/main.js NOT FOUND"
fi
echo "Checking if index.html exists:"
if [ -f "index.html" ]; then
    echo "✓ index.html exists"
else
    echo "✗ index.html NOT FOUND"
fi
pnpm run build