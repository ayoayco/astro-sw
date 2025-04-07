import { ServiceWorkerPreset } from '../../types'
import activate from './activate'

export const deleteOldCaches: () => ServiceWorkerPreset = () => ({
  activate,
})

export default deleteOldCaches
