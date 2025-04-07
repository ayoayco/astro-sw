import type { BuildOptions } from 'esbuild'

export type AstroServiceWorkerPreset = {
  activate?: (options: { event: ExtendableEvent; cacheName: string }) => void
  install?: (options: {
    event: ExtendableEvent
    routes: string[]
    cacheName: string
  }) => void
  fetch?: (options: { event: FetchEvent; cacheName: string }) => void
}

export type AstroServiceWorkerConfig = {
  path?: string
  presets?: AstroServiceWorkerPreset[]
  assetCachePrefix?: string
  assetCacheVersionID?: string
  customRoutes?: string[]
  excludeRoutes?: string[]
  logAssets?: true
  esbuild?: BuildOptions
  registrationHooks?: {
    installing?: () => void
    waiting?: () => void
    active?: () => void
    error?: (error: Error) => void
    unsupported?: () => void
    afterRegistration?: () => void
  }
  experimental?: {
    strategy?: {
      fetchFn: () => void
      installFn: () => void
      activateFn: () => void
      waitFn: () => void
    }
  }
}
