import { defineConfig } from 'vite'

import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/tanstack/vite'

const target = process.env.TARGET ?? 'cloudflare-module'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    mcpPlugin(),
    ...(target === 'cloudflare-module' ? [cloudflare({ viteEnvironment: { name: 'ssr' } })] : []),
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
})
