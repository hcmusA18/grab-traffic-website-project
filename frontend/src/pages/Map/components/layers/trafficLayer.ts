import { LayerProps } from 'react-map-gl'
import { colors } from 'theme/colors'

export const trafficLayer = {
  id: 'traffic',
  type: 'line',
  source: 'traffic',
  'source-layer': 'traffic',
  paint: {
    'line-color': [
      'case',
      ['==', ['get', 'congestion'], 'low'],
      colors.trafficLow,
      ['==', ['get', 'congestion'], 'moderate'],
      colors.trafficModerate,
      ['==', ['get', 'congestion'], 'heavy'],
      colors.trafficHeavy,
      ['==', ['get', 'congestion'], 'severe'],
      colors.trafficServe,
      '#000000'
    ],
    'line-width': 4
  }
} as LayerProps
