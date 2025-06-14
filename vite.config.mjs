import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      verbose: false,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    })
  ],
  base: '/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 优化构建
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 代码分割配置
    rollupOptions: {
      output: {
        // 分离第三方库
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'ui-vendor': ['daisyui', '@heroicons/vue'],
          'player-vendor': ['hls.js'],
        },
        // 配置chunk文件名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';
          if (facadeModuleId.includes('view')) {
            return 'js/views/[name]-[hash].js';
          }
          return 'js/[name]-[hash].js';
        },
        // 配置入口文件名
        entryFileNames: 'js/[name]-[hash].js',
        // 配置资源文件名
        assetFileNames: '[ext]/[name]-[hash].[ext]',
      },
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用CSS代码分割
    cssCodeSplit: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})