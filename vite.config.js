import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Determine the base path based on whether this is a PR preview build
const isPrPreview = process.env.VITE_PR_PREVIEW === 'true'
const prNumber = process.env.PR_NUMBER
const basePath = isPrPreview && prNumber
  ? `/expense-tracker/pr-preview/pr-${prNumber}/`
  : '/expense-tracker/'

export default defineConfig({
  plugins: [vue()],
  base: basePath,
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
