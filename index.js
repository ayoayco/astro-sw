import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'pathe';
import { randomUUID } from "node:crypto";

/**
 * @typedef {{
 *  path: string,
 *  assetCachePrefix?: string,
 *  assetCacheVersionID?: string,
 *  customRoutes?: Array<string>,
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
        customRoutes = []
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

    let output = 'static'

    return {
        'name': 'astro-sw',
        'hooks': {
            'astro:config:setup': ({ injectScript, config }) => {
                output = config.output;
                injectScript('page', registrationScript);
            },
            'astro:build:ssr': ({ manifest }) => {
                const files = manifest.routes.map(route => route.file.replaceAll('/', ''));
                const assetsMinusFiles = manifest.assets.filter(ass => !files.includes(ass.replaceAll('/', '')));

                assets = output === 'static'
                    ? assetsMinusFiles
                    : manifest.assets.filter(ass => !ass.includes('sw.js'));
            },
            'astro:build:done': async ({ dir, routes, pages, }) => {
                const outFile = fileURLToPath(new URL('./sw.js', dir));
                const __dirname = path.resolve(path.dirname('.'));
                const swPath = path.join(__dirname, serviceWorkerPath ?? '');
                let originalScript;

                const _publicFiles = (await readdir(dir, { withFileTypes: true }) ?? [])
                    .filter(dirent => dirent.isFile())
                    .map(dirent => `/${dirent.name}`);

                const _routes = routes
                    .filter(({ isIndex }) => isIndex)
                    .map(({ pathname }) => pathname)
                    .filter(pathname => pathname !== '')
                    ?? [];

                const _pages = pages
                    .filter(({ pathname }) => pathname !== '')
                    .map(({ pathname }) => `/${pathname}`)
                    ?? [];

                const _pagesWithoutEndSlash = pages
                    .filter(({ pathname }) => pathname !== '')
                    .map(({ pathname }) => {
                        const lastChar = pathname.slice(-1);
                        const len = pathname.length;
                        return lastChar === '/'
                            ? `/${pathname.slice(0, len - 1)}`
                            : `/${pathname}`;
                    })
                    .filter(pathname => pathname !== '')
                    ?? [];

                assets = [...new Set([
                    ...assets,
                    ..._routes,
                    ..._pages,
                    ..._pagesWithoutEndSlash,
                    ...customRoutes,
                    ..._publicFiles
                ])].filter(asset => !!asset
                    && asset !== ''
                    && !asset.includes('404')
                    && !asset.includes('index.html'));

                console.log('[astro-sw] Assets for caching:', assets);

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
