type MapLocation = {
  id: number
  place: string
  lat?: string
  long?: string
  request?: string
  distance?: number
  air_quality?: number
  traffic_quality?: number
}

type LocationResponse = {
  count: number
  time?: string // time of data collection
  keyword?: string
  param?: {
    radius: string
    number: string
  }
  center?: MapLocation
  locations: MapLocation[]
}

type LocationRequest = {
  id?: string
  keyword?: string
  radius?: string
  number?: string
}

type TrafficData = {
  day?: number
  hour?: number
  car?: number
  bike?: number
  truck?: number
  bus?: number
  person?: number
  motorbike?: number
  count?: number
  traffic_quality?: number
  traffic_quality_index?: number
}

type AirData = {
  day?: number
  hour?: number
  co?: number
  no?: number
  no2?: number
  o3?: number
  so2?: number
  pm2_5?: number
  pm10?: number
  nh3?: number
  count?: number
  average?: number
  air_quality?: number
  air_quality_index?: number
}

type TrafficAirData = {
  traffic_data?: TrafficData
  air_data?: AirData
}

type QualityIndex = {
  hour?: number
  day?: number
  traffic_quality_index?: number
  air_quality_index?: number
}

type TrafficAirDataResponse = {
  id: number
  name: string
  lat: string
  long: string
  time?: string
  date?: string
  request: string
  air_data?: AirData
  traffic_data?: TrafficData
  data_day?: QualityIndex[]
  data_hour?: QualityIndex[]
  traffic?: TrafficData
  average_air?: AirData
}

type TrafficAirDataRequest = {
  id?: string
  date?: string
  range?: number
}

type RankingRequest = {
  option: string
  date?: string
}

type RankingResponse = {
  time?: string
  date?: string
  count: number
  option: string
  ranking?: RankingData[]
  traffic_ranking?: RankingData[]
  air_ranking?: RankingData[]
}

type RankingData = {
  id: number
  name: string
  traffic_quality_index?: number
  air_quality_index?: number
  rank: number
}

type Ranking<T = number> = {
  location: string
  value: T
}

type RecordValue = string | Blob | File | number | boolean | null

interface HttpService {
  get<T>(url: string): Promise<T>
  post<T, U extends Record<string, RecordValue>>(url: string, data?: U): Promise<T>
}
