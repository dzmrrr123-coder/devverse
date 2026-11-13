import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  define: {
    'process.env': {},
  },
  preview: {
    allowedHosts: true,
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      router: {
        routeFileIgnorePattern: '\\.test\\.(ts|tsx)$',
      },
    }),
    viteReact(),
  ],
})

export default config
