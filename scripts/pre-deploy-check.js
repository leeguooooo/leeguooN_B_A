#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running pre-deployment checks...\n');

let hasErrors = false;

// 1. 检查 package.json 和 lockfile 同步
console.log('1️⃣  Checking package.json and lockfile sync...');
try {
  execSync('pnpm install --frozen-lockfile --dry-run', { stdio: 'ignore' });
  console.log('✅ Package.json and pnpm-lock.yaml are in sync\n');
} catch (error) {
  console.error('❌ Package.json and pnpm-lock.yaml are out of sync!');
  console.error('   Run "pnpm install" to update the lockfile\n');
  hasErrors = true;
}

// 2. 检查环境变量
console.log('2️⃣  Checking required environment variables...');
const requiredEnvVars = ['API_KEY', 'KV_AUTH_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingEnvVars.join(', '));
  console.warn('   Make sure these are set in Vercel\n');
} else {
  console.log('✅ All required environment variables are set\n');
}

// 3. 检查构建
console.log('3️⃣  Testing production build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed!');
  hasErrors = true;
}

// 4. 检查 API 文件
console.log('4️⃣  Checking API endpoints...');
const apiFiles = [
  'api/games.js',
  'api/parseLiveLinks.js',
  'api/getIframeSrc.js',
  'api/getStreamUrl.js',
  'api/webhook/update.js'
];

const missingApis = apiFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));
if (missingApis.length > 0) {
  console.error('❌ Missing API files:', missingApis.join(', '));
  hasErrors = true;
} else {
  console.log('✅ All API endpoints exist\n');
}

// 5. 检查依赖版本
console.log('5️⃣  Checking critical dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const criticalDeps = ['vite', 'vue', 'terser'];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.warn(`   ⚠️  ${dep} is in devDependencies, should be in dependencies for Vercel`);
  } else {
    console.error(`   ❌ ${dep} is missing!`);
    hasErrors = true;
  }
});

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ Pre-deployment checks failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ All pre-deployment checks passed!');
  console.log('🚀 Ready to deploy to Vercel!');
}