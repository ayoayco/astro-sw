// @ts-check

import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import serviceWorker from '../package/src/astro-sw'

export default defineConfig({
  output: 'static',
  adapter: node({
    mode: 'middleware',
  }),
  site: 'https://ayo.ayco.io',
  integrations: [
    serviceWorker({
      path: './src/example_sw.js',
      customRoutes: [
        // '/threads'
      ],
      excludeRoutes: ['/exclude'],
      assetCachePrefix: 'hey',
      logAssets: true,
      esbuild: {
        minify: true,
      },
      registrationHooks: {
        installing: () => console.log('>>> installing...'),
        waiting: () => console.log('>>> waiting...'),
        active: () => console.log('>>> active...'),
        error: (error) => console.error('>>> error', error),
        afterRegistration: async () => {
          const sw = await navigator.serviceWorker.getRegistration()
          console.log('>>> registrered', sw)
        },
      },
    }),
  ],
})
