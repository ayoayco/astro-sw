import type { BuildOptions } from 'esbuild'

export type Config = {
  path: string
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
