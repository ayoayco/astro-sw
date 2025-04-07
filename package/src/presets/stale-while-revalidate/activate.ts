import { ServiceWorkerPreset } from '../../types'

export const activateFn: ServiceWorkerPreset['activate'] = ({ event }) => {
  console.info('activating service worker...', event)
}

export default activateFn
