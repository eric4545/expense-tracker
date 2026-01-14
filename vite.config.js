import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Determine the base path based on whether this is a PR preview build
// Use REPO_NAME from environment, fallback to 'expense-tracker' for backward compatibility
const repoName = process.env.REPO_NAME || 'expense-tracker'
const isPrPreview = process.env.VITE_PR_PREVIEW === 'true'
const prNumber = process.env.PR_NUMBER

const basePath = isPrPreview && prNumber
  ? `/${repoName}/pr-preview/pr-${prNumber}/`
  : `/${repoName}/`

export default defineConfig({
  plugins: [vue()],
  base: basePath,
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
