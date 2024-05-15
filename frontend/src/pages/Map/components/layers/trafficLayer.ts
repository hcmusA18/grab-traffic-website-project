import { LayerProps } from 'react-map-gl'
// import { colors } from 'theme/colors'
import colors from 'tailwindcss/colors'

export const trafficLayer = {
  id: 'traffic',
  type: 'line',
  source: 'traffic',
  'source-layer': 'traffic',
  paint: {
    'line-color': [
      'case',
      ['==', ['get', 'congestion'], 'low'],
      colors.green[500],
      ['==', ['get', 'congestion'], 'moderate'],
      colors.yellow[500],
      ['==', ['get', 'congestion'], 'heavy'],
      colors.rose[500],
      ['==', ['get', 'congestion'], 'severe'],
      colors.amber[700],
      '#000000'
    ],
    'line-width': 4
  }
} as LayerProps
