/**
 * preset for stale-while-revalidate caching strategy
 */

import { ServiceWorkerPreset } from '../../types'
import activate from './activate'
import install from './install'
import fetch from './fetch'

export const presetStaleWhileRevalidate: ServiceWorkerPreset = {
  activate,
  install,
  fetch,
}

export default presetStaleWhileRevalidate
