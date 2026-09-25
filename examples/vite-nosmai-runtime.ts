import { createReadStream, statSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const contentTypes: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.nmdl': 'application/octet-stream',
  '.wasm': 'application/wasm',
}

/**
 * Serves Nosmai's generated runtime before Vite's public-directory guard.
 *
 * The engine glue must be loaded as a native ES module at runtime, while the
 * WASM and model files must be copied byte-for-byte. Keeping them in public/
 * is therefore correct for production builds, but Vite intentionally rejects
 * source imports from public/ during development. This middleware preserves
 * the production layout without asking Vite to transform generated SDK files.
 */
export function nosmaiRuntime(runtimeRoot: string): Plugin {
  const resolvedRoot = path.resolve(runtimeRoot)
  const rootPrefix = `${resolvedRoot}${path.sep}`

  return {
    name: 'nosmai-runtime-assets',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use('/nosmai', (request, response, next) => {
        let pathname: string
        try {
          pathname = decodeURIComponent(
            new URL(request.url ?? '/', 'http://localhost').pathname,
          )
        } catch {
          next()
          return
        }

        const relativePath = pathname.replace(/^\/+/, '')
        const filePath = path.resolve(resolvedRoot, relativePath)
        if (!filePath.startsWith(rootPrefix)) {
          next()
          return
        }

        try {
          if (!statSync(filePath).isFile()) {
            next()
            return
          }
        } catch {
          next()
          return
        }

        response.statusCode = 200
        response.setHeader(
          'Content-Type',
          contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
        )
        response.setHeader('Cache-Control', 'no-store')

        if (request.method === 'HEAD') {
          response.end()
          return
        }

        const stream = createReadStream(filePath)
        stream.on('error', next)
        stream.pipe(response)
      })
    },
  }
}
