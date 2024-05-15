import { RankingBoard } from './RankingBoard'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RankingService } from 'services/RankingService'
import colors from 'tailwindcss/colors'

export const TrafficRanking = () => {
  const [data, setData] = useState<Ranking[]>([])
  const rankingService = RankingService.getInstance()
  const { t } = useTranslation()

  const rankingOptions = {
    title: t('traffic_ranking'),
    columns: [
      { title: t('location'), key: 'location' as keyof Ranking },
      { title: t('average_traffic'), key: 'value' as keyof Ranking }
    ],
    color: [
      { range: [0, 6] as [number, number], color: colors.green[500] },
      { range: [7, 13] as [number, number], color: colors.yellow[500] },
      { range: [14, 20] as [number, number], color: colors.orange[500] },
      { range: [21, 26] as [number, number], color: colors.red[500] },
      { range: [27, 33] as [number, number], color: colors.violet[500] },
      { range: [34, 9999] as [number, number], color: colors.purple[700] }
    ]
  }

  useEffect(() => {
    const fetchData = async () => {
      const rankingData = await rankingService.getCurrentRanking({ option: 'traffic' })
      setData(rankingData.traffic_ranking?.reverse() || [])
    }

    fetchData()

    const interval = setInterval(fetchData, 10000)

    return () => clearInterval(interval)
  }, [rankingService])

  return (
    <div className="rounded-md border px-2">
      <RankingBoard ranking={data} options={rankingOptions} />
    </div>
  )
}
