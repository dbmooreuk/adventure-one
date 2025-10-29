import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },

  server: {
    port: 3000,
    strictPort: false,
    open: false
  },

  resolve: {
    alias: {
      '@': '/src',
      '@assets': '/public/assets'
    }
  }
})
