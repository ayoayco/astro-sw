> **>>> TL;DR:** Simple Astro integration to use your own authored service worker; by default, devs retain full control as opposed to getting generated sw code

# Astro SW

[![Package information: NPM version](https://img.shields.io/npm/v/@ayco/astro-sw)](https://www.npmjs.com/package/@ayco/astro-sw)
[![Package information: NPM license](https://img.shields.io/npm/l/@ayco/astro-sw)](https://www.npmjs.com/package/@ayco/astro-sw)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ayco/astro-sw)](#library-size)

The integration accepts service worker path and automatically injects dynamic variables such as `assets` generated by Astro for caching.

## Installation

In your [Astro](https://astro.build) project:

```bash
# if using npm
$ npm i -D @ayco/astro-sw

# if using pnpm
$ pnpm add -D @ayco/astro-sw
```

## Usage

Example `astro.config.mjs`

```js
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
      path: "./src/sw.js",
      assetCachePrefix: 'cozy-reader',
    })
  ]
});
```

## API

The integration accepts a configuration object of type `ServiceWorkerConfig` with the following properties

| property | type | required? |  notes |
| --- | --- | --- | --- |
| path | string | required | path to your *own* service worker script; no surprises & easy debugging |
| assetCachePrefix | string | optional | cache storage name prefix; useful for debugging |
| assetCacheVersionID | string | optional | cache storage name versioning; by default, a random UUID is used but you can provide your own for easy debugging & invalidation |

## Example sw.js

You can find an example service worker (`example_sw.js`) in the [repository](https://ayco.io/gh/astro-sw), and here's the [raw file](https://raw.githubusercontent.com/ayoayco/astro-sw/main/example_sw.js) too.
