import type { PLData } from './analysis'
import rawData from './seedData.json'

export function getSeedPLData(): PLData {
  return rawData as unknown as PLData
}
