/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect, useMemo } from 'react'
import { Map, MapRef, Source, Layer, MapLayerMouseEvent, Marker } from 'react-map-gl'
import { FeatureCollection, Point } from 'geojson'
import { useAppDispatch, setShowDetails, useAppSelector, useInitEnvironData } from 'libs/redux'
import { Details } from 'components/Details'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import reactIcon from 'assets/react.svg'
import { Spin } from 'antd'
import { distance, point } from '@turf/turf'
import { setCurrentLocationID } from 'libs/redux/sliceData'
import MapControls from './components/MapControls'
import {
  clusterCountLayer,
  clusterLayer,
  unclusteredPointLayer,
  unclusteredQualityLayer,
  trafficLayer
} from './components/layers'

export const MapPage = () => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  const mapRef = useRef<MapRef>(null)
  const locations = useAppSelector((state) => state.data.mapLocation)
  const [isLoading, setIsLoading] = useState(true)
  const [isStyleLoaded, setIsStyleLoaded] = useState(false)
  const [hasData, setHasData] = useState(false)
  const dispatch = useAppDispatch()
  useInitEnvironData()

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
        properties: {
          place: location.place,
          request: location.request,
          id: location.id,
          air_quality: location.air_quality
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(location.long ?? '106.692330564'), parseFloat(location.lat ?? '10.770496918')]
        }
      }))
    }
  }, [locations])

  const zoomToDistrict = (e: MapLayerMouseEvent, location?: MapLocation) => {
    const { long, lat } = location ?? { long: e.lngLat.lng.toString(), lat: e.lngLat.lat.toString() }
    if (mapRef.current) {
      const { lng: currentLong, lat: currentLat } = mapRef.current.getMap().getCenter()
      const currentLocation = point([currentLong, currentLat])
      const targetLocation = point([
        parseFloat(long ?? e.lngLat.lng.toString()),
        parseFloat(lat ?? e.lngLat.lat.toString())
      ])
      const km = distance(currentLocation, targetLocation, 'kilometers')

      mapRef.current.easeTo({
        center: targetLocation.geometry.coordinates as [number, number],
        duration: km * 400,
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
        dispatch(setCurrentLocationID(districtData.id))
      }
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

  mapRef.current?.on('styledata', function () {
    setIsStyleLoaded(true)
  })

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
        {isStyleLoaded === true && hasData && (
          <div>
            <MapControls />

            <Source id="traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
              <Layer {...trafficLayer} />
            </Source>

            {/* <Source
              id="districts"
              type="geojson"
              data={geojson || undefined}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
              clusterProperties={{
                air_quality: ['max', ['get', 'air_quality']]
              }}>
              <Layer {...clusterLayer} />
              <Layer {...clusterCountLayer} />
              <Layer {...unclusteredPointLayer} />
              <Layer {...unclusteredQualityLayer} />
            </Source> */}
          </div>
        )}
        {locations.map((location, index) => {
          return (
            <Marker
              key={location.id}
              latitude={parseFloat(location.lat ?? '10.770496918')}
              longitude={parseFloat(location.long ?? '106.692330564')}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                // zoomToDistrict(e, location)
              }}>
              <div className="disappearing-appearing-div" style={{ animationDelay: `${index * 2}s` }}>
                <div
                  style={{
                    width: 140,
                    height: 40,
                    backgroundColor: '#ff4081',
                    opacity: 0.8,
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    border: '1px solid white',
                    borderRadius: 8
                  }}>
                  <h3 style={{ color: 'white', textAlign: 'center' }}>{location.place}</h3>
                </div>
                <div
                  style={{ height: 64, width: 2, backgroundColor: '#ff4081', marginBottom: -20, marginLeft: 64 }}></div>
                <div className="pulsing-dot" />
              </div>
            </Marker>
          )
        })}
      </Map>
      <Details />
    </div>
  )
}

export default MapPage
