import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from './store'
import { setCurrentAirData, setCurrentTrafficData, setMapLocation } from './sliceData'
import { LocationService } from 'services/LocationService'
import { EnviroService } from 'services/EnviroService'
import { useEffect } from 'react'

/**
 * Typed useSelector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/**
 * Typed useDispatch hook
 */
export const useAppDispatch = () => useDispatch<AppDispatch>()

export const useInitLocationData = () => {
  const dispatch = useAppDispatch()
  const locationService = LocationService.getInstance()

  useEffect(() => {
    const fetchMapLocationData = async () => {
      try {
        const data = await locationService.getAllLocations()
        dispatch(setMapLocation(data))
      } catch (error) {
        console.error('Error fetching map location data:', error)
      }
    }

    fetchMapLocationData()
  }, [dispatch, locationService])
}

export const useInitEnvironData = () => {
  const dispatch = useAppDispatch()
  const [currentLocationID] = useAppSelector((state) => [state.data.currentLocationID])
  const environService = EnviroService.getInstance()

  useEffect(() => {
    // Skip if currentLocationID is not set
    if (currentLocationID === -1) return

    const fetchEnvironData = async () => {
      try {
        const data = await environService.getCurrentData({ id: currentLocationID.toString() })
        dispatch(setCurrentAirData(data.air_data ?? ({} as AirData)))
        dispatch(setCurrentTrafficData(data.traffic_data ?? ({} as TrafficData)))
      } catch (error) {
        console.error('Error fetching environ data:', error)
      }
    }

    fetchEnvironData()
  }, [currentLocationID, dispatch, environService])
}
