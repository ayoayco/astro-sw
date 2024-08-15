import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import serviceWorker from "./index.js";

export default defineConfig({
  // output: "server",
  // adapter: node({
  //   mode: "middleware"
  // }),
  site: 'https://ayo.ayco.io',
  integrations: [
    serviceWorker({
      path: "./example_sw.js",
      assetCachePrefix: 'cozy-reader',
      customRoutes: [
        '/treads'
      ]
    })
  ]
});
