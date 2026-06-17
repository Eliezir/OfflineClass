// Runs seed-session.cjs under Electron-as-Node so the better-sqlite3 native ABI
// matches the one electron-builder compiled (same trick as db:studio).
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const electronBin = require('electron')
const here = dirname(fileURLToPath(import.meta.url))
const seed = join(here, 'seed-session.cjs')

const child = spawn(electronBin, [seed, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
})
child.on('exit', (code) => process.exit(code ?? 0))
