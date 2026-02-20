import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096']
      }
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8'
    },
    include: ['src/**/*.spec.ts']
  },
})
