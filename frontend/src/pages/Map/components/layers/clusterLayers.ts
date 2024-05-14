import { LayerProps } from 'react-map-gl'
import { colors } from 'theme/colors'

export const clusterLayer = {
  id: 'clusters',
  type: 'circle',
  source: 'districts',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'match',
      ['get', 'air_quality'],
      1,
      colors.green200,
      2,
      colors.yellow200,
      3,
      colors.orange200,
      4,
      colors.red200,
      colors.dark200
    ],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
} as LayerProps

export const clusterCountLayer = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'districts',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{air_quality}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#fff',
    'text-halo-color': '#d8d8d8'
  }
} as LayerProps
