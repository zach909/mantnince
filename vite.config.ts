import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
    hmr: { overlay: false },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
