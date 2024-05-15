import { useState, useRef, useEffect, useCallback, lazy, useMemo } from 'react'
import { Map, MapRef, Source, Layer } from 'react-map-gl'
import { useAppDispatch, setShowDetails, useAppSelector, useInitEnvironData } from 'libs/redux'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import { Spin } from 'antd'
import { distance, point } from '@turf/turf'
import { setCurrentAirData, setCurrentLocationID, setCurrentTrafficData } from 'libs/redux/sliceData'
import { trafficLayer } from './components/layers'
import { debounce } from 'lodash'
import { useTranslation } from 'react-i18next'

const Details = lazy(() => import('components/Details'))
const CustomMarker = lazy(() => import('./components/CustomMarker'))
const MapControls = lazy(() => import('./components/MapControls'))

export const MapPage = () => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  const mapRef = useRef<MapRef>(null)
  const locations = useAppSelector((state) => state.data.mapLocation)
  const [filteredLocations, setFilteredLocations] = useState(locations)
  const [isLoading, setIsLoading] = useState(true)
  const [isStyleLoaded, setIsStyleLoaded] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [center, setCenter] = useState<[number, number]>([106.692330564, 10.770496918])
  const [zoom, setZoom] = useState(16)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  useInitEnvironData()

  useEffect(() => {
    if (locations.length > 0 || locations) {
      setHasData(true)
    }
  }, [locations])

  const zoomToDistrict = useCallback((lng: number, lat: number) => {
    if (mapRef.current) {
      const { lng: currentLong, lat: currentLat } = mapRef.current.getMap().getCenter()
      const currentLocation = point([currentLong, currentLat])
      const targetLocation = point([lng, lat])
      const km = distance(currentLocation, targetLocation, 'kilometers')

      mapRef.current.easeTo({
        center: targetLocation.geometry.coordinates as [number, number],
        duration: km * 400,
        zoom: 18,
        essential: true
      })
    }
  }, [])

  const locationFilterer = useCallback(
    (zoom: number, center: [number, number]) => {
      return locations.filter((location) => {
        if (zoom > 18) {
          return true
        }
        const locationPoint = point([
          parseFloat(location.long ?? '106.692330564'),
          parseFloat(location.lat ?? '10.770496918')
        ])
        const currentPoint = point(center)
        const km = distance(locationPoint, currentPoint, 'kilometers')
        return km < 10
      })
    },
    [locations]
  )

  const debouncedUpdate = useMemo(() => {
    return debounce((center: [number, number], zoom: number) => {
      const filtered = locationFilterer(zoom, center)
      setFilteredLocations(filtered)
    }, 300)
  }, [locationFilterer])

  useEffect(() => {
    if (mapRef.current) {
      debouncedUpdate(center, zoom)
    }
  }, [center, zoom, debouncedUpdate])

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      map.on('zoomend', () => {
        if (map.getZoom() !== zoom) {
          setZoom(map.getZoom())
        }
      })
      map.on('moveend', () => {
        const center = map.getCenter()
        setCenter([center.lng, center.lat])
      })
    }
  }, [zoom])

  mapRef.current?.on('styledata', function () {
    setIsStyleLoaded(true)
  })

  return (
    <div className="flex h-full w-full flex-1">
      <Spin spinning={isLoading && isStyleLoaded} fullscreen size="large" tip={t('loading...')} />
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        reuseMaps
        style={{ width: '100%' }}
        mapStyle="mapbox://styles/mapbox/standard"
        initialViewState={{
          latitude: center[1],
          longitude: center[0],
          zoom: zoom,
          pitch: 70,
          bearing: 0
        }}
        pitchWithRotate
        maxZoom={22}
        minZoom={14}
        onLoad={() => {
          setIsLoading(false)
        }}
        onZoom={(e) => {
          if (e) {
            setZoom(e.viewState.zoom)
          }
        }}
        onMove={(e) => {
          if (e) {
            setCenter([e.viewState.longitude, e.viewState.latitude])
            setZoom(e.viewState.zoom)
          }
        }}
        attributionControl={false}>
        <div>
          <MapControls />

          {isStyleLoaded && hasData && (
            <Source id="traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
              <Layer {...trafficLayer} />
            </Source>
          )}
        </div>
        {filteredLocations.map((location, _) => {
          return (
            <CustomMarker
              key={location.id.toString()}
              locationID={location.id.toString()}
              lat={parseFloat(location.lat ?? '10.770496918')}
              lng={parseFloat(location.long ?? '106.692330564')}
              onClick={(locationID: string, lng: number, lat: number) => {
                zoomToDistrict(lng, lat)
                dispatch(setShowDetails({ showDetails: true, district: location.place }))
                dispatch(setCurrentLocationID(parseInt(locationID)))
                dispatch(setCurrentAirData(undefined))
                dispatch(setCurrentTrafficData(undefined))
              }}
              air_quality={location.air_quality as number}
              air_quality_index={location?.air_quality_index as number}
            />
          )
        })}
      </Map>
      <Details />
    </div>
  )
}

export default MapPage
