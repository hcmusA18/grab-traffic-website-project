import AxiosHttpService from './AxiosHttpService'

export interface IEnviroService {
  getCurrentData(request: TrafficAirDataRequest): Promise<TrafficAirData>
  getDailyData(
    request: TrafficAirDataRequest
  ): Promise<{ chartData: TrafficAirData[]; traffic: TrafficData; air: AirData }>
  getWeeklyData(
    request: TrafficAirDataRequest
  ): Promise<{ chartData: TrafficAirData[]; traffic: TrafficData; air: AirData }>
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

  async getWeatherData(locationID: string): Promise<WeatherResponse> {
    try {
      const response = await this.axiosService.get<WeatherResponse>(`/weather/locationID=${locationID}`)
      return response
    } catch (error) {
      console.error('Error fetching weather data:', error)
      throw error
    }
  }

  async getDailyData(
    request: TrafficAirDataRequest
  ): Promise<{ chartData: TrafficAirData[]; traffic: TrafficData; air: AirData }> {
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
      return {
        chartData: finalData,
        traffic: response.traffic as TrafficData,
        air: response.average_air as AirData
      }
    } catch (error) {
      console.error('Error fetching traffic and air data daily:', error)
      throw error
    }
  }

  async getWeeklyData(
    request: TrafficAirDataRequest
  ): Promise<{ chartData: TrafficAirData[]; traffic: TrafficData; air: AirData }> {
    try {
      const response = await this.axiosService.post<TrafficAirDataResponse, TrafficAirDataRequest>(
        '/data/weekly',
        request
      )
      const finalData: TrafficAirData[] = response.data_day
        ?.map((data: QualityIndex) => {
          return {
            air_data: {
              air_quality_index: data.air_quality_index,
              day: data.day
            },
            traffic_data: {
              traffic_quality_index: data.traffic_quality_index,
              day: data.day
            }
          }
        })
        .filter(Boolean) as TrafficAirData[]
      return {
        chartData: finalData,
        traffic: response.traffic as TrafficData,
        air: response.average_air as AirData
      }
    } catch (error) {
      console.error('Error fetching traffic and air data daily:', error)
      throw error
    }
  }

  async getRangeData(
    request: TrafficAirDataRequest
  ): Promise<{ chartData: TrafficAirData[]; traffic: TrafficData; air: AirData }> {
    try {
      const response = await this.axiosService.post<TrafficAirDataResponse, TrafficAirDataRequest>(
        '/data/range',
        request
      )
      const finalData: TrafficAirData[] = response.data_day?.map((data: QualityIndex) => {
        return {
          air_data: {
            air_quality_index: data.air_quality_index,
            day: data.day
          },
          traffic_data: {
            traffic_quality_index: data.traffic_quality_index,
            day: data.day
          }
        }
      }) as TrafficAirData[]
      return {
        chartData: finalData,
        traffic: response.traffic as TrafficData,
        air: response.average_air as AirData
      }
    } catch (error) {
      console.error('Error fetching traffic and air data daily:', error)
      throw error
    }
  }
}
