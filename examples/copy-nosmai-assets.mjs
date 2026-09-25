import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const packageRoot = path.dirname(require.resolve('@nosmai/web/package.json'))
const destination = path.resolve(process.argv[2] ?? 'public/nosmai')

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
for (const directory of ['engine', 'engine-baseline', 'models']) {
  await cp(path.join(packageRoot, directory), path.join(destination, directory), {
    recursive: true,
  })
}
console.log(`copied Nosmai runtime assets to ${destination}`)
