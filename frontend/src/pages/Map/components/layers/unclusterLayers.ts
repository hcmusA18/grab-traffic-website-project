import { LayerProps } from 'react-map-gl'
import { colors } from 'theme/colors'

export const unclusteredQualityLayer = {
  id: 'unclustered-quality',
  type: 'symbol',
  source: 'districts',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'text-field': '{air_quality}',
    'text-justify': 'auto',
    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#fff'
  }
} as LayerProps

export const unclusteredPointLayer = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'districts',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['==', ['get', 'air_quality'], 1],
      colors.green,
      ['==', ['get', 'air_quality'], 2],
      colors.yellow,
      ['==', ['get', 'air_quality'], 3],
      colors.orange,
      ['==', ['get', 'air_quality'], 4],
      colors.red,
      ['==', ['get', 'air_quality'], 5],
      colors.dark,
      colors.dark
    ],
    'circle-radius': 20,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }
} as LayerProps
