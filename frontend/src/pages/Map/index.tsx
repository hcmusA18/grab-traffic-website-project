import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Map,
  MapRef,
  Source,
  Layer,
  MapLayerMouseEvent,
  GeolocateControl,
  LayerProps,
  NavigationControl,
  ScaleControl
} from 'react-map-gl'
import { FeatureCollection, Point } from 'geojson'
import { useAppDispatch, setShowDetails, useAppSelector } from 'libs/redux'
import { Details } from 'components/Details'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import reactIcon from 'assets/react.svg'
import { Spin } from 'antd'
import { distance, point } from '@turf/turf'
import { setCurrentAirData, setCurrentLocationID, setCurrentTrafficData } from 'libs/redux/sliceData'

export const MapPage = () => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  const mapRef = useRef<MapRef>(null)
  const locations = useAppSelector((state) => state.data.mapLocation)
  const [isLoading, setIsLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (locations.length > 0 || locations) {
      setHasData(true)
    }
  }, [locations])

  const geojson: FeatureCollection<Point> | null = useMemo(() => {
    if (!locations || locations.length === 0) {
      return null
    }

    return {
      type: 'FeatureCollection',
      features: locations.map((location) => ({
        type: 'Feature',
        properties: { place: location.place, request: location.request },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(location.long ?? '106.692330564'), parseFloat(location.lat ?? '10.770496918')]
        }
      }))
    }
  }, [locations])

  const clusterLayer = {
    id: 'clusters',
    type: 'circle',
    source: 'districts',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
    }
  }
  const clusterCountLayer = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'districts',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  }

  const unclusteredPointLayer = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'districts',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 20,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  }

  const zoomToDistrict = (e: MapLayerMouseEvent, location: MapLocation) => {
    e.originalEvent.stopPropagation()
    const { long, lat } = location
    if (mapRef.current) {
      const { lng: currentLong, lat: currentLat } = mapRef.current.getMap().getCenter()
      const currentLocation = point([currentLong, currentLat])
      const targetLocation = point([parseFloat(long ?? '10.770496918'), parseFloat(lat ?? '106.692330564')])
      const km = distance(currentLocation, targetLocation, 'kilometers')

      mapRef.current.easeTo({
        center: [parseFloat(long ?? '10.770496918'), parseFloat(lat ?? '106.692330564')],
        duration: km * 1000,
        zoom: 16,
        essential: true
      })
    }
  }

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const features = event.features
    const unclusteredPoints = features?.filter((f) => f.layer?.id === 'unclustered-point')

    if (unclusteredPoints && unclusteredPoints.length > 0) {
      const clickedFeature = unclusteredPoints[0]
      const districtData = locations.find((d) => d.place === clickedFeature.properties?.place)

      if (districtData) {
        zoomToDistrict(event, districtData)
        dispatch(setShowDetails({ showDetails: true, district: districtData.place }))
        dispatch(setCurrentLocationID(districtData.id ?? ''))
        dispatch(setCurrentAirData(undefined))
        dispatch(setCurrentTrafficData(undefined))
      }
    }
  }

  const trafficLayer = {
    id: 'traffic',
    type: 'line',
    source: 'traffic',
    'source-layer': 'traffic',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'congestion'], 'low'],
        '#00ff00',
        ['==', ['get', 'congestion'], 'moderate'],
        '#ffff00',
        ['==', ['get', 'congestion'], 'heavy'],
        '#ff0000',
        ['==', ['get', 'congestion'], 'severe'],
        '#8b0000',
        '#000000'
      ],
      'line-width': 4
    }
  }

  useEffect(() => {
    if (mapRef.current) {
      // add an image for the camera icon after the map has loaded
      if (mapRef.current.getMap()) {
        const image = new Image()
        image.src = reactIcon
        image.onload = () => {
          mapRef.current?.getMap().addImage('camera', image)
        }
      }
    }
  }, [mapRef, isLoading])

  return (
    <div className="flex h-full w-full flex-1">
      <Spin spinning={isLoading} fullscreen size="large" tip="Loading..." />
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        reuseMaps
        style={{ width: '100%' }}
        mapStyle="mapbox://styles/mapbox/standard"
        initialViewState={{
          latitude: 10.770496918,
          longitude: 106.692330564,
          zoom: 16,
          pitch: 70,
          bearing: 0
        }}
        pitchWithRotate
        maxZoom={22}
        onLoad={() => {
          setIsLoading(false)
        }}
        interactiveLayerIds={['unclustered-point']}
        onClick={handleMapClick}
        attributionControl={false}>
        <ScaleControl maxWidth={100} unit="metric" />
        <NavigationControl showCompass showZoom position="bottom-right" />
        <GeolocateControl positionOptions={{ enableHighAccuracy: true }} trackUserLocation position="bottom-right" />
        <Source id="traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
          <Layer {...(trafficLayer as LayerProps)} />
        </Source>

        {!isLoading && hasData && (
          <Source
            id="districts"
            type="geojson"
            data={geojson || undefined}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}>
            <Layer {...(clusterLayer as LayerProps)} />
            <Layer {...(clusterCountLayer as LayerProps)} />
            <Layer {...(unclusteredPointLayer as LayerProps)} />
          </Source>
        )}
      </Map>
      <Details />
    </div>
  )
}
