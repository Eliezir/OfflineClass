// Launches Drizzle Studio against the app's runtime SQLite database.
//
// better-sqlite3 is a native module compiled for Electron's Node ABI (via the
// `electron-builder install-app-deps` postinstall), so plain `drizzle-kit
// studio` under system Node fails with NODE_MODULE_VERSION mismatch. We run it
// under Electron-as-Node instead, which has the matching ABI — no rebuild, no
// extra driver dependency. drizzle.config.ts resolves the userData DB path.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

// `electron` resolves to the path of the Electron binary when required in Node.
const electronBin = require('electron')
const drizzleBin = join(dirname(require.resolve('drizzle-kit')), 'bin.cjs')

const child = spawn(electronBin, [drizzleBin, 'studio', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
})

child.on('exit', (code) => process.exit(code ?? 0))
