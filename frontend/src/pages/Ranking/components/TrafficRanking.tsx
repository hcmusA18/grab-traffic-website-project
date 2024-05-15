import { RankingBoard } from './RankingBoard'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RankingService } from 'services/RankingService'

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
      { range: [0, 100] as [number, number], color: '#7ABA78' },
      { range: [101, 200] as [number, number], color: '#FEB941' },
      { range: [201, 250] as [number, number], color: '#F97300' },
      { range: [251, 400] as [number, number], color: '#C40C0C' },
      { range: [401, 600] as [number, number], color: '#8644A2' },
      { range: [601, 9999] as [number, number], color: '#32012F' }
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
