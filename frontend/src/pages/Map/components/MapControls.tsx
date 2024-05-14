import React from 'react'
import { GeolocateControl, NavigationControl, ScaleControl } from 'react-map-gl'

const MapControls: React.FC = () => {
  return (
    <>
      <ScaleControl maxWidth={100} unit="metric" />
      <NavigationControl showCompass showZoom position="bottom-right" />
      <GeolocateControl positionOptions={{ enableHighAccuracy: true }} trackUserLocation position="bottom-right" />
    </>
  )
}

export default MapControls
