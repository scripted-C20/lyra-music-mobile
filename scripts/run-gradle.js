const { spawnSync } = require('node:child_process')

const [, , ...args] = process.argv

if (!args.length) {
  console.error('Missing Gradle arguments')
  process.exit(1)
}

const command = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const result = spawnSync(command, args, {
  cwd: 'android',
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
