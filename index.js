import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from "node:crypto";

/**
 * @typedef {{
 *  path: string,
 *  assetCachePrefix?: string,
 *  assetCacheVersionID?: string,
 *  onInstalling?: Function,
 *  onInstalled?: Function,
 *  onActive?: Function,
 *  onError?: Function
 * }} ServiceWorkerConfig
 * @typedef {import('astro').AstroIntegration} AstroIntegration
 */

/**
 * Accepts configuration options with service worker path
 * and injects needed variables such as `__assets` generated by Astro
 * @param {ServiceWorkerConfig} config 
 * @returns {AstroIntegration}
 */
export default function serviceWorker(config) {
    let {
        assetCachePrefix,
        assetCacheVersionID = randomUUID(),
        path: serviceWorkerPath,
        /**
         * TODO: use registration hooks callbacks
         */
        // onInstalling,
        // onInstalled,
        // onActive,
        // onError,
        // onUnsupported,
    } = config;

    /**
     * @type {Array<string>}
     */
    let assets = [];

    const registrationScript = `const registerSW = async () => {
            if ("serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    });
                    if (registration.installing) {
                        // installingFn();
                        console.log('[astro-sw] Installing...')
                    } else if (registration.waiting) {
                        // installedFn();
                        console.log('[astro-sw] Installed...')
                    } else if (registration.active) {
                        // activeFn();
                        console.log('[astro-sw] Active...')
                    }
                } catch (error) {
                    // onError(error);
                    console.error('[astro-sw] ERR', error)
                }
            } else {
                // onUnsupported();
                console.log('[astro-sw] Browser does not support Service Worker')
            }
        }

        registerSW();`

    return {
        'name': 'astro-sw',
        'hooks': {
            'astro:config:setup': ({injectScript}) => {
                injectScript('page', registrationScript);
            },
            'astro:build:ssr': ({ manifest }) => {
                assets = manifest.assets.filter(ass => !ass.includes('sw.js'))
            },
            'astro:build:done': async ({ dir, routes }) => {
                const outFile = fileURLToPath(new URL('./sw.js', dir));
                const __dirname = path.resolve(path.dirname('.'));
                const swPath = path.join(__dirname, serviceWorkerPath ?? '');
                let originalScript;

                const _routes = routes
                    .filter(({isIndex}) => isIndex)
                    .map(({pathname}) => pathname)
                    ?? [];

                assets = [...new Set([...assets, ..._routes])]

                console.log('>>> assets', assets);

                try {
                    console.log('[astro-sw] Using service worker:', swPath);
                    originalScript = await readFile(swPath);
                } catch {
                    throw Error('[astro-sw] ERROR: service worker script not found!', swPath)
                }
                const assetsDeclaration = `const __assets = ${JSON.stringify(assets)};\n`;
                const versionDeclaration = `const __version = ${JSON.stringify(assetCacheVersionID)};\n`;
                const prefixDeclaration = `const __prefix = ${JSON.stringify(assetCachePrefix)};\n`;

                await writeFile(
                    outFile,
                    assetsDeclaration + versionDeclaration + prefixDeclaration + originalScript
                );
            }
        }
    }
};
