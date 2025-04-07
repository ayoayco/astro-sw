import { ServiceWorkerPreset } from '../../types'
import activate from './activate'

const deleteOldCaches: ServiceWorkerPreset = {
  activate,
}

export default deleteOldCaches
