import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nosmaiRuntime } from '../vite-nosmai-runtime'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    nosmaiRuntime(path.join(here, 'public/nosmai')),
    react(),
  ],
})
