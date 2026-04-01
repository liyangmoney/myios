import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['element-plus'],
    exclude: []
  },
  server: {
    port: 13000,
    host: true,
    allowedHosts: ['myjghy.myds.me'],
    proxy: {
      '/api': {
        target: 'http://myjghy.myds.me:9090',
        changeOrigin: true
      }
    }
  }
})
