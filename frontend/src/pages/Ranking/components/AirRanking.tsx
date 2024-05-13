import { RankingBoard } from './RankingBoard'
import { useEffect, useState } from 'react'
import { colors } from 'theme'
import { RankingService } from 'services/RankingService'

const rankingOptions = {
  title: 'Air Quality Ranking',
  columns: [
    { title: 'Location', key: 'location' as keyof Ranking },
    { title: 'PM2.5', key: 'value' as keyof Ranking }
  ],
  color: [
    { range: [0, 50] as [number, number], color: colors.green },
    { range: [51, 100] as [number, number], color: colors.yellow },
    { range: [101, 150] as [number, number], color: colors.orange },
    { range: [151, 200] as [number, number], color: colors.red },
    { range: [201, 300] as [number, number], color: colors.purple },
    { range: [301, 9999] as [number, number], color: colors.dark }
  ]
}

export const AirRanking = () => {
  const [data, setData] = useState<Ranking[]>([])
  const rankingService = RankingService.getInstance()

  useEffect(() => {
    const fetchData = async () => {
      const rankingData = await rankingService.getCurrentRanking({ option: 'air' })
      setData(rankingData.air_ranking || [])
    }

    fetchData()

    const interval = setInterval(fetchData, 10000)

    return () => clearInterval(interval)
  }, [rankingService])

  return (
    <div className="box-border rounded-md border px-2">
      <RankingBoard ranking={data} options={rankingOptions} />
    </div>
  )
}
