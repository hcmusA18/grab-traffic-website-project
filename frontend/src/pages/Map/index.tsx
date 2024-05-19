import { useState, useRef, useEffect, useCallback, lazy, useMemo } from 'react'
import { Map, MapRef, Source, Layer } from 'react-map-gl'
import { useAppDispatch, setShowDetails, useAppSelector, useInitEnvironData } from 'libs/redux'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import { Spin, Switch, Tooltip } from 'antd'
import { distance, point } from '@turf/turf'
import { setCurrentAirData, setCurrentLocationID, setCurrentTrafficData } from 'libs/redux/sliceData'
import { trafficLayer } from './components/layers'
import { debounce } from 'lodash'
import { useTranslation } from 'react-i18next'
import colors from 'tailwindcss/colors'
import { airQualityConfig } from 'libs/utils/constant'

const Details = lazy(() => import('components/Details'))
const CustomMarker = lazy(() => import('./components/CustomMarker'))
const MapControls = lazy(() => import('./components/MapControls'))

const useAirQualityFilters = () => {
  const [filters, setFilters] = useState({
    good: true,
    moderate: true,
    unhealthy: true,
    very_unhealthy: true,
    hazardous: true
  })

  const toggleFilter = (quality: keyof typeof airQualityConfig) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [quality]: !prevFilters[quality]
    }))
  }

  return { filters, toggleFilter }
}

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
  const [qualityLength, setQualityLength] = useState<{
    good: number
    moderate: number
    unhealthy: number
    very_unhealthy: number
    hazardous: number
  }>({
    good: 0,
    moderate: 0,
    unhealthy: 0,
    very_unhealthy: 0,
    hazardous: 0
  })
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { filters, toggleFilter } = useAirQualityFilters()
  useInitEnvironData()

  useEffect(() => {
    if (locations.length > 0) {
      setHasData(true)
      const qualityCounts = locations.reduce(
        (counts, item) => {
          const index = item.air_quality_index as number
          for (const [key, value] of Object.entries(airQualityConfig)) {
            if (index >= value.min && index <= value.max) {
              counts[key as keyof typeof qualityCounts]++
              break // If a match is found, no need to check further
            }
          }
          return counts
        },
        { good: 0, moderate: 0, unhealthy: 0, very_unhealthy: 0, hazardous: 0 }
      )

      setQualityLength(qualityCounts)
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

  const applyFilters = useCallback(() => {
    const filtered = locations.filter((location) => {
      const index = location.air_quality_index ?? 0
      for (const [key, value] of Object.entries(filters)) {
        if (
          value &&
          index >= airQualityConfig[key as keyof typeof airQualityConfig].min &&
          index <= airQualityConfig[key as keyof typeof airQualityConfig].max
        ) {
          return true
        }
      }
      return false
    })
    setFilteredLocations(filtered)
  }, [locations, filters])

  const debouncedUpdate = useMemo(() => debounce(applyFilters, 300), [applyFilters])

  useEffect(() => {
    if (mapRef.current) {
      debouncedUpdate()
    }
  }, [center, zoom, debouncedUpdate])

  const airQualityKeys = Object.keys(airQualityConfig) as (keyof typeof airQualityConfig)[]

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
        minZoom={12}
        onLoad={() => {
          setIsLoading(false)
        }}
        onIdle={() => {
          setIsStyleLoaded(true)
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
      <div className="fixed bottom-0 left-0 z-10 mb-4 ml-2 flex flex-col justify-start space-y-2 rounded-md bg-white bg-opacity-80 px-3 py-2 md:flex-row md:space-x-2 md:rounded-full">
        {airQualityKeys.map((key) => (
          <Tooltip key={key} title={`${qualityLength[key]} ${t('location')}`} placement="topRight">
            <Switch
              checkedChildren={t(`${key}_quality_switch`)}
              unCheckedChildren={t(`${key}_quality_switch`)}
              checked={filters[key]}
              onChange={() => toggleFilter(key)}
              style={{
                backgroundColor: filters[key] ? airQualityConfig[key].color : colors.gray[300]
              }}
            />
          </Tooltip>
        ))}
        <span className="md:ml-2">
          {filteredLocations.length} {t('locations')}
        </span>
      </div>
      <Details />
    </div>
  )
}

export default MapPage
