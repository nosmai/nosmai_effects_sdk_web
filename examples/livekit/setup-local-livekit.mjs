import { execFileSync, spawn } from 'node:child_process'
import { mkdir, open, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'

const host = '127.0.0.1'
const port = 7880
const localDir = path.resolve('.local')
const pidFile = path.join(localDir, 'livekit.pid')
const logFile = path.join(localDir, 'livekit.log')

const canConnect = () => new Promise((resolve) => {
  const socket = net.createConnection({ host, port })
  const done = (value) => { socket.destroy(); resolve(value) }
  socket.setTimeout(300)
  socket.once('connect', () => done(true))
  socket.once('timeout', () => done(false))
  socket.once('error', () => done(false))
})

await mkdir(localDir, { recursive: true })
if (!await canConnect()) {
  const output = await open(logFile, 'a')
  const server = spawn('livekit-server', ['--dev', '--bind', host], {
    detached: true,
    stdio: ['ignore', output.fd, output.fd],
  })
  server.unref()
  await writeFile(pidFile, `${server.pid}\n`, { mode: 0o600 })
  for (let attempt = 0; attempt < 40 && !await canConnect(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  if (!await canConnect()) {
    const log = await readFile(logFile, 'utf8').catch(() => '')
    throw new Error(`LiveKit did not start. See ${logFile}\n${log.slice(-1000)}`)
  }
  console.log(`started local LiveKit server (pid ${server.pid})`)
} else {
  console.log('using LiveKit already listening on 127.0.0.1:7880')
}

const token = (identity) => execFileSync('lk', [
  'token', 'create', '--dev', '--join', '--room', 'nosmai-web-test',
  '--identity', identity, '--valid-for', '24h', '--token-only',
], { encoding: 'utf8' }).trim()

const publisher = token('nosmai-browser-publisher')
const viewer = token('nosmai-browser-viewer')
await writeFile('.env.local', [
  'VITE_LIVEKIT_URL=ws://127.0.0.1:7880',
  `VITE_LIVEKIT_PUBLISHER_TOKEN=${publisher}`,
  `VITE_LIVEKIT_VIEWER_TOKEN=${viewer}`,
  '',
].join('\n'), { mode: 0o600 })
console.log('wrote temporary participant tokens to ignored .env.local')
