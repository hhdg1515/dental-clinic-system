import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isEmbedBuild = command === 'build' && env.INTRANET_EMBED === 'true';
  const embedOutDir = path.resolve(__dirname, '../外网-react/public/内网');
  // 开发模式下检查是否需要使用 /内网 前缀（通过代理访问时）
  const useIntranetBase = env.INTRANET_DEV_PROXY === 'true';

  return {
    // 开发模式：默认'/'，设置INTRANET_DEV_PROXY=true时使用'/内网/'
    // 生产构建：嵌入模式使用'/内网/'，否则使用'/'
    base: isEmbedBuild || useIntranetBase ? '/内网/' : '/',
    plugins: [
      react(),
      // Gzip compression
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false
      }),
      // Brotli compression
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
      port: 5174, // Different port from public site
      strictPort: false,
      hmr: {
        // 明确指定HMR WebSocket连接，避免中文路径编码问题
        host: 'localhost',
        port: 5174,
        protocol: 'ws'
      }
    },
    build: {
      outDir: isEmbedBuild ? embedOutDir : 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'chart-vendor': ['recharts', 'three']
          }
        }
      },
      minify: 'esbuild',
      chunkSizeWarningLimit: 600,
      cssCodeSplit: true
    }
  };
});
