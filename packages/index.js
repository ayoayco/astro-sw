/**
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Ayo Ayco <https://ayo.ayco.io>
 */

import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'pathe';
import { build } from 'esbuild';

const ASTROSW = '@ayco/astro-sw';
/**
 * @typedef {import('astro').AstroIntegration} AstroIntegration
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/**
 * Accepts configuration options with service worker path
 * and injects needed variables such as `__assets` generated by Astro
 * @param {{
 *  path: string,
 *  assetCachePrefix?: string,
 *  assetCacheVersionID?: string,
 *  customRoutes?: string[],
 *  excludeRoutes?: string[],
 *  logAssets?: true,
 *  esbuild?: BuildOptions,
 *  registrationHooks?: {
 *      installing?: () => void,
 *      waiting?: () => void,
 *      active?: () => void,
 *      error?: (error) => void,
 *      unsupported?: () => void,
 *      afterRegistration?: () => void,
 *  }
 *  experimental?: {
 *      strategy?:  {
 *          fetchFn: () => void,
 *          installFn: () => void,
 *          activateFn: () => void,
 *          waitFn: () => void,
 *      }
 *  }
 * }} options 
 * @returns {AstroIntegration}
 */
export default function serviceWorker(options) {
    let {
        assetCachePrefix = ASTROSW,
        assetCacheVersionID = '0',
        path: serviceWorkerPath = undefined,
        customRoutes = [],
        excludeRoutes = [],
        logAssets = false,
        esbuild = {},
        registrationHooks = {}
    } = options || {};

    const {
        installing: installingFn = () => {},
        waiting: waitingFn = () => {},
        active: activeFn = () => {},
        error: errorFn = () => {},
        unsupported: unsupportedFn = () => {},
        afterRegistration: afterRegistrationFn = () => {},
    } = registrationHooks;

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
                        (${installingFn.toString()})();
                    } else if (registration.waiting) {
                        (${waitingFn.toString()})();
                    } else if (registration.active) {
                        (${activeFn.toString()})();
                    }

                    (${afterRegistrationFn.toString()})();
                } catch (error) {
                    (${errorFn.toString()})(error);
                }
            } else {
                (${unsupportedFn.toString()})();
            }
        }

        registerSW();`

    let output = 'static';
    const __dirname = path.resolve(path.dirname('.'));

    return {
        'name': ASTROSW,
        'hooks': {
            'astro:config:setup': async ({ injectScript, config: _config, command, logger }) => {

                if (!serviceWorkerPath || serviceWorkerPath === '') {
                    // REQUIRED OPTION IS MISSING
                    logger.error('Missing required path to service worker script');
                }
                // const transformedScript=await transform(registrationScript)

                output = _config.output;
                if (command === 'build') {
                    injectScript('page', registrationScript);
                }
            },
            'astro:config:done': async ({injectTypes, logger}) => {
                let injectedTypes = `
declare const __assets: string[];
declare const __version: string;
declare const __prefix: string;`
                injectTypes({filename: 'caching.d.ts', content: injectedTypes})
            },
            'astro:build:ssr': ({ manifest }) => {
                const files = manifest.routes.map(route => route.file.replaceAll('/', ''));
                const assetsMinusFiles = manifest.assets.filter(ass => !files.includes(ass.replaceAll('/', '')));

                assets = output === 'static'
                    ? assetsMinusFiles
                    : manifest.assets.filter(ass => !ass.includes('sw.js'));
            },
            'astro:build:done': async ({ dir, routes, pages, logger }) => {
                const outfile = fileURLToPath(new URL('./sw.js', dir));
                const swPath = (serviceWorkerPath && serviceWorkerPath !== '')
                    ? path.join(__dirname, serviceWorkerPath)
                    : undefined;
                let originalScript;

                const _publicFiles = (await readdir(dir, { withFileTypes: true }) ?? [])
                    .filter(dirent => dirent.isFile())
                    .map(dirent => `/${dirent.name}`);

                const _routes = routes
                    .filter(({ isIndex }) => isIndex)
                    .flatMap(({ pathname }) => pathname === '/' ? pathname : [pathname, `${pathname}/`])
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

                const _excludeRoutes = [
                    ...excludeRoutes,
                    ...excludeRoutes.map(route => `${route}/`)
                ];

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
                    && !asset.includes('index.html')
                    && !_excludeRoutes.includes(asset)
                );


                if (logAssets) {
                    logger.info(`${assets.length} assets for caching: \n  ▶ ${assets.toString().replaceAll(',', '\n  ▶ ')}\n`);
                } else {
                    logger.info(`${assets.length} assets for caching.`);
                }

                try {
                    logger.info(`Using service worker in path: ${swPath}`);
                    originalScript = await readFile(swPath);
                } catch {
                    logger.error(`Service worker script not found! ${swPath}`)
                    if (!swPath) {

                    logger.error(`

[${ASTROSW}]  ERR: The 'path' option is required!
[${ASTROSW}] INFO: Please see service worker options in https://ayco.io/gh/astro-sw#readme
`);
                    }
                }

                const assetsDeclaration = `const __assets = ${JSON.stringify(assets)};\n`;
                const versionDeclaration = `const __version = ${JSON.stringify(assetCacheVersionID)};\n`;
                const prefixDeclaration = `const __prefix = ${JSON.stringify(assetCachePrefix)};\n`;

                /**
                 * TODO: allow importing in dev's sw.js by resolving imports
                 */

                const tempFile = `${swPath}.tmp.ts`;

                try {
                    await writeFile(
                        tempFile,
                        assetsDeclaration + versionDeclaration + prefixDeclaration + originalScript,
                        { flag: 'w+' }
                    );
                } catch (err) {
                    logger.error(err.toString())
                }

                try {
                    await build({
                        bundle: true,
                        ...esbuild,
                        outfile,
                        platform: 'browser',
                        entryPoints: [tempFile],
                    })
                } catch (err) {
                    logger.error(err.toString())
                }

                // remove temp file
                try {
                    await unlink(tempFile);
                } catch (err) {
                    logger.error(err.toString())
                }
            }
        }
    }
};
