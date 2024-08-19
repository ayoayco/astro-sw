// @ts-check

import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import serviceWorker from "./packages/index.js";
import { Strategies } from "./packages/strategies/index.js";

export default defineConfig({
  output: "hybrid",
  adapter: node({
    mode: "middleware"
  }),
  site: 'https://ayo.ayco.io',
  integrations: [
    serviceWorker({
      path: './src/example_sw.js',
      customRoutes: [
        // '/threads'
      ],
      excludeRoutes: [
        '/exclude'
      ],
      logAssets: true,
      esbuild: {
        minify: true
      },
      registrationHooks: {
        installing: () => console.log('>>> installing...'),
        waiting: () => console.log('>>> waiting...'),
        active: () => console.log('>>> active...'),
        error: (error) => console.error('>>> error', error),
        'afterRegistration': async () => {
            const sw = await navigator.serviceWorker.getRegistration();
            console.log('>>> registrered', sw)
        }
      },
      experimental: {
        strategy: Strategies.CacheRevalidatePreloadFallback,
      }
    })
  ]
});
