import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type DataState = {
  mapLocation: MapLocation[]
  currentLocationID: number
  currentTrafficData?: TrafficData
  currentAirData?: AirData
  numberShow: number
  rankDecrease: boolean
}

const DataSlice = createSlice({
  name: 'data',
  initialState: {
    mapLocation: [],
    currentLocationID: -1,
    currentTrafficData: undefined,
    currentAirData: undefined,
    numberShow: 10,
    rankDecrease: false
  } as DataState,
  reducers: {
    setMapLocation(state, action: PayloadAction<MapLocation[]>) {
      return { ...state, mapLocation: action.payload }
    },
    setCurrentLocationID(state, action: PayloadAction<number>) {
      return { ...state, currentLocationID: action.payload }
    },
    setCurrentTrafficData(state, action: PayloadAction<TrafficData | undefined>) {
      return { ...state, currentTrafficData: action.payload }
    },
    setCurrentAirData(state, action: PayloadAction<AirData | undefined>) {
      return { ...state, currentAirData: action.payload }
    },
    setNumberShow(state, action: PayloadAction<number>) {
      return { ...state, numberShow: action.payload }
    },
    setRankDecrease(state, action: PayloadAction<boolean>) {
      return { ...state, rankDecrease: action.payload }
    }
  }
})

export const {
  setMapLocation,
  setCurrentLocationID,
  setCurrentTrafficData,
  setCurrentAirData,
  setNumberShow,
  setRankDecrease
} = DataSlice.actions
export const dataReducer = DataSlice.reducer
