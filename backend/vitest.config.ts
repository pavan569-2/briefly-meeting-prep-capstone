import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false, // Explicit imports required — no auto-injected globals
    include: ['src/**/*.test.ts'],
    isolate: true, // Each file gets its own module registry
  },
})
