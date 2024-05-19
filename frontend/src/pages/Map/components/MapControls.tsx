import React from 'react'
import { NavigationControl } from 'react-map-gl'

const MapControls: React.FC = () => {
  return <NavigationControl showCompass showZoom position="bottom-right" />
}

export default MapControls
