/**
 * preset for stale-while-revalidate caching strategy
 */

import { ServiceWorkerPreset } from '../../types'
import install from './install'
import fetch from './fetch'

export const staleWhileRevalidate: () => ServiceWorkerPreset = () => ({
  install,
  fetch,
})

export default staleWhileRevalidate
