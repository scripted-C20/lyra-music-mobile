const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const cacheDir = path.join(os.homedir(), '.gradle-project-cache', 'lx-music-mobile')
fs.mkdirSync(cacheDir, { recursive: true })

const extraArgs = process.argv.slice(2).join(' ')
const command = [
  'npx',
  'react-native',
  'run-android',
  '--active-arch-only',
  `--extra-params '--project-cache-dir ${cacheDir}'`,
  extraArgs,
].filter(Boolean).join(' ')

const result = process.platform === 'win32'
  ? spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  : spawnSync('npx', [
    'react-native',
    'run-android',
    '--active-arch-only',
    '--extra-params',
    `--project-cache-dir ${cacheDir}`,
    ...process.argv.slice(2),
  ], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
