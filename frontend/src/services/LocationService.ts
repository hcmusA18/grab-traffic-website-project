// locationService.ts
import AxiosHttpService from './AxiosHttpService'

export interface ILocationService {
  getAllLocations(): Promise<MapLocation[]>
  searchLocationByName(request: LocationRequest): Promise<MapLocation[]>
  autofillLocationByName(request: LocationRequest): Promise<MapLocation[]>
  getNearbyLocations(request: LocationRequest): Promise<MapLocation[]>
}

export class LocationService implements ILocationService {
  private axiosService = AxiosHttpService.getInstance()
  private static instance: LocationService

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  async getAllLocations(): Promise<MapLocation[]> {
    try {
      const response = await this.axiosService.get<LocationResponse>('/location/all')
      return response.locations
    } catch (error) {
      throw new Error(`Failed to get all locations: ${(error as Error).message}`)
    }
  }

  async searchLocationByName(request: LocationRequest): Promise<MapLocation[]> {
    try {
      const response = await this.axiosService.post<LocationResponse, LocationRequest>('/location/name/search', request)
      return response.locations
    } catch (error) {
      throw new Error(`Failed to search locations by name: ${(error as Error).message}`)
    }
  }

  async autofillLocationByName(request: LocationRequest): Promise<MapLocation[]> {
    try {
      const response = await this.axiosService.post<LocationResponse, LocationRequest>(
        '/location/name/autofill',
        request
      )
      return response.locations
    } catch (error: unknown) {
      throw new Error(`Failed to autofill locations by name: ${(error as Error).message}`)
    }
  }

  async getNearbyLocations(request: LocationRequest): Promise<MapLocation[]> {
    try {
      const response = await this.axiosService.post<LocationResponse, LocationRequest>('/location/nearby', request)
      return response.locations
    } catch (error) {
      throw new Error(`Failed to get nearby locations: ${(error as Error).message}`)
    }
  }
}
