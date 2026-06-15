import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Absolute path avoids Prisma's relative-`file:` ambiguity (CLI resolves from
// the schema dir, the client from CWD). The test DB is migrated in
// test/global-setup.ts and truncated between tests in test/setup.ts.
const testDbUrl = `file:${path.resolve(import.meta.dirname, 'prisma/test.db')}`

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDbUrl
    },
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: ['src/main.ts', 'src/models/**', 'src/exception/erro-response.ts', 'src/config/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
})
