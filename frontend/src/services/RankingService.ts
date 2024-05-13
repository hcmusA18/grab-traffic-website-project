import AxiosHttpService from './AxiosHttpService'

export interface IRankingService {
  getCurrentRanking(request: RankingRequest): Promise<{ air_ranking?: Ranking[]; traffic_ranking?: Ranking[] }>
  getDailyRanking(request: RankingRequest): Promise<{ air_ranking?: Ranking[]; traffic_ranking?: Ranking[] }>
  getWeeklyRanking(request: RankingRequest): Promise<{ air_ranking?: Ranking[]; traffic_ranking?: Ranking[] }>
}

export class RankingService implements IRankingService {
  private axiosService = AxiosHttpService.getInstance()
  private static instance: RankingService

  private constructor() {}

  static getInstance(): RankingService {
    if (!RankingService.instance) {
      RankingService.instance = new RankingService()
    }
    return RankingService.instance
  }

  private mapRanking(rankingData: { name: string; rank: number }[] | undefined, valueKey: string): Ranking[] {
    return (
      rankingData?.map((ranking) => ({
        location: ranking.name,
        value: Number(ranking[valueKey as keyof typeof ranking]) || 0
      })) || []
    )
  }

  async getCurrentRanking(request: RankingRequest): Promise<{ air_ranking?: Ranking[]; traffic_ranking?: Ranking[] }> {
    try {
      const response = await this.axiosService.post<RankingResponse, RankingRequest>('/ranking/current', request)

      const rankings = {
        air_ranking: undefined as Ranking[] | undefined,
        traffic_ranking: undefined as Ranking[] | undefined
      }

      if (request.option === 'air') {
        rankings.air_ranking = this.mapRanking(response.ranking, 'air_quality_index')
      } else if (request.option === 'traffic') {
        rankings.traffic_ranking = this.mapRanking(response.ranking, 'traffic_quality_index')
      } else {
        rankings.air_ranking = this.mapRanking(response.air_ranking, 'air_quality_index')
        rankings.traffic_ranking = this.mapRanking(response.traffic_ranking, 'traffic_quality_index')
      }

      return rankings
    } catch (error) {
      throw new Error(`Failed to get current ranking: ${(error as Error).message}`)
    }
  }

  async getDailyRanking(request: RankingRequest): Promise<{ air_ranking?: Ranking[]; traffic_ranking?: Ranking[] }> {
    try {
      const response = await this.axiosService.post<RankingResponse, RankingRequest>('/ranking/daily', request)

      const rankings = {
        air_ranking: undefined as Ranking[] | undefined,
        traffic_ranking: undefined as Ranking[] | undefined
      }

      if (request.option === 'air') {
        rankings.air_ranking = this.mapRanking(response.ranking, 'ranking')
      } else if (request.option === 'traffic') {
        rankings.traffic_ranking = this.mapRanking(response.ranking, 'ranking')
      } else {
        rankings.air_ranking = this.mapRanking(response.air_ranking, 'air_quality_index')
        rankings.traffic_ranking = this.mapRanking(response.traffic_ranking, 'traffic_quality_index')
      }

      return rankings
    } catch (error) {
      throw new Error(`Failed to get daily ranking: ${(error as Error).message}`)
    }
  }

  async getWeeklyRanking(request: RankingRequest): Promise<{ air_ranking?: Ranking[]; traffic_ranking?: Ranking[] }> {
    try {
      const response = await this.axiosService.post<RankingResponse, RankingRequest>('/ranking/weekly', request)

      const rankings = {
        air_ranking: undefined as Ranking[] | undefined,
        traffic_ranking: undefined as Ranking[] | undefined
      }

      if (request.option === 'air') {
        rankings.air_ranking = this.mapRanking(response.ranking, 'ranking')
      } else if (request.option === 'traffic') {
        rankings.traffic_ranking = this.mapRanking(response.ranking, 'ranking')
      } else {
        rankings.air_ranking = this.mapRanking(response.air_ranking, 'air_quality_index')
        rankings.traffic_ranking = this.mapRanking(response.traffic_ranking, 'traffic_quality_index')
      }

      return rankings
    } catch (error) {
      throw new Error(`Failed to get weekly ranking: ${(error as Error).message}`)
    }
  }
}
