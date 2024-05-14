import { useEffect, useState } from 'react'
import { RankingBoard } from './RankingBoard'
import { colors } from 'theme/colors'
import { RankingService } from 'services/RankingService'

const rankingOptions = {
  title: 'Change Ranking',
  columns: [
    { title: 'Location', key: 'location' as keyof Ranking },
    { title: 'Air Quality Percent Change', key: 'value' as keyof Ranking }
  ],
  color: [
    { range: [0, 8] as [number, number], color: colors.green },
    { range: [9, 14] as [number, number], color: colors.yellow },
    { range: [15, 27] as [number, number], color: colors.orange },
    { range: [28, 34] as [number, number], color: colors.red },
    { range: [35, 47] as [number, number], color: colors.purple },
    { range: [48, 9999] as [number, number], color: colors.dark }
  ]
}

export const ChangeRanking = () => {
  const [data, setData] = useState<Ranking[]>([])
  const rankingService = RankingService.getInstance()

  useEffect(() => {
    const fetchData = async () => {
      const rankingData = await rankingService.getWeeklyRanking({ option: 'change' })
      setData(
        rankingData.change_ranking
          ?.sort((a, b) => b.value - a.value)
          .map((rank, _) => ({ location: rank.location, value: Math.round(rank.value) })) || []
      )
    }
    fetchData()
  }, [rankingService])

  return (
    <div className="box-border rounded-md border px-2">
      <RankingBoard ranking={data} options={rankingOptions} />
    </div>
  )
}
