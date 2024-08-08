import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import serviceWorker from "@ayco/astro-sw";

export default defineConfig({
  output: "server",
  adapter: node({
    mode: "middleware"
  }),
  integrations: [
    serviceWorker({
      path: "./example-sw.js",
      assetCachePrefix: 'cozy-reader',
    })
  ]
});
