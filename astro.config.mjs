import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import serviceWorker from "./index.js";

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware"
  }),
  integrations: [
    serviceWorker({
      path: "./example_sw.js",
      assetCachePrefix: 'cozy-reader',
      // onInstalled: () => console.log('Installed...'),
      // onInstalling: () => console.log('Installing...'),
      // onActive: () => console.log('Active!'),
      // onError: (error) => console.error(`Registration failed on ${error}`)
    })
  ]
});
