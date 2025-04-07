import type { BuildOptions } from 'esbuild'

export type ServiceWorkerPreset = {
  activate?: (options: { event: ExtendableEvent; cacheName: string }) => void
  install?: (options: {
    event: ExtendableEvent
    routes: string[]
    cacheName: string
  }) => void
  fetch?: (options: { event: FetchEvent; cacheName: string }) => void
}

export type Config = {
  path?: string
  presets?: ServiceWorkerPreset[]
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
