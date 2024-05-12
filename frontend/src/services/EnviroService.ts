import AxiosHttpService from './AxiosHttpService'

export interface IEnviroService {
  getCurrentData(request: TrafficAirDataRequest): Promise<TrafficAirData>
  getDailyData(request: TrafficAirDataRequest): Promise<TrafficAirData[]>
  getWeeklyData(request: TrafficAirDataRequest): Promise<TrafficAirData[]>
}

export class EnviroService implements IEnviroService {
  private axiosService = AxiosHttpService.getInstance()
  private static instance: EnviroService | null = null
  private constructor() {}

  static getInstance(): EnviroService {
    if (!EnviroService.instance) {
      EnviroService.instance = new EnviroService()
    }
    return EnviroService.instance
  }

  async getCurrentData(request: TrafficAirDataRequest): Promise<TrafficAirData> {
    try {
      const response = await this.axiosService.get<TrafficAirDataResponse>(`/data/current/locationID=${request.id}`)
      return {
        air_data: response.air_data,
        traffic_data: response.traffic_data
      }
    } catch (error) {
      console.error('Error fetching traffic and air data:', error)
      throw error
    }
  }

  async getDailyData(request: TrafficAirDataRequest): Promise<TrafficAirData[]> {
    try {
      const response = await this.axiosService.post<TrafficAirDataResponse, TrafficAirDataRequest>(
        '/data/daily',
        request
      )
      const finalData: TrafficAirData[] = response.data_hour
        ?.map((data: QualityIndex) => {
          return {
            air_data: {
              air_quality_index: data.air_quality_index,
              hour: data.hour
            },
            traffic_data: {
              traffic_quality_index: data.traffic_quality_index,
              hour: data.hour
            }
          }
        })
        .filter(Boolean) as TrafficAirData[]
      return finalData
    } catch (error) {
      console.error('Error fetching traffic and air data daily:', error)
      throw error
    }
  }

  async getWeeklyData(request: TrafficAirDataRequest): Promise<TrafficAirData[]> {
    try {
      const response = await this.axiosService.post<TrafficAirDataResponse, TrafficAirDataRequest>(
        '/data/weekly',
        request
      )
      const finalData: TrafficAirData[] = response.traffic_data_day
        ?.map((trafficData: TrafficData, index: number) => {
          const airData = response.air_data_day?.[index]
          if (airData) {
            return {
              air_data: airData,
              traffic_data: trafficData
            }
          }
        })
        .filter(Boolean) as TrafficAirData[]
      return finalData
    } catch (error) {
      console.error('Error fetching traffic and air data daily:', error)
      throw error
    }
  }

  async getRangeData(request: TrafficAirDataRequest): Promise<TrafficAirData[]> {
    const { id, startDate, endDate } = request
    try {
      const dayDiff = new Date(endDate as string).getDate() - new Date(startDate as string).getDate()
      const requestList = Array.from({ length: dayDiff + 1 }, (_, i) => {
        const date = new Date(startDate as string)
        date.setDate(date.getDate() + i)
        return this.getDailyData({ id, date: date.toISOString().split('T')[0] })
      })
      const response = await Promise.all(requestList)
      return response.flat()
    } catch (error) {
      console.error('Error fetching RANGE traffic and air data:', error)
      throw error
    }
  }
}
