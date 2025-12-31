import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // 开发模式下代理内网-react请求到5174端口
      // 需要同时匹配中文和URL编码版本
      '/内网': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true  // 支持WebSocket（HMR热更新）
      },
      // URL编码版本: %E5%86%85%E7%BD%91 = 内网
      '/%E5%86%85%E7%BD%91': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    sourcemap: false,
    // Code splitting and optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    },
    // Minification (esbuild is faster and works well)
    minify: 'esbuild',
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
    // CSS code splitting
    cssCodeSplit: true
  }
});
