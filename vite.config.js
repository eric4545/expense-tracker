import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/expense-tracker/',
  test: {
    environment: 'jsdom',
    globals: true
  }
})