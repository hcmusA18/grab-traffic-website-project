import { RankingBoard } from './RankingBoard'
import { useEffect, useState } from 'react'
import { RankingService } from 'services/RankingService'
import { useTranslation } from 'react-i18next'
import colors from 'tailwindcss/colors'

export const AirRanking = () => {
  const [data, setData] = useState<Ranking[]>([])
  const rankingService = RankingService.getInstance()
  const { t } = useTranslation()

  const rankingOptions = {
    title: t('air_quality_ranking'),
    columns: [
      { title: 'Location', key: 'location' as keyof Ranking },
      { title: 'PM2.5', key: 'value' as keyof Ranking }
    ],
    color: [
      { range: [0, 50] as [number, number], color: colors.green[500] },
      { range: [51, 100] as [number, number], color: colors.yellow[500] },
      { range: [101, 150] as [number, number], color: colors.orange[500] },
      { range: [151, 200] as [number, number], color: colors.red[500] },
      { range: [201, 300] as [number, number], color: colors.violet[500] },
      { range: [301, 9999] as [number, number], color: colors.purple[500] }
    ]
  }

  useEffect(() => {
    const fetchData = async () => {
      const rankingData = await rankingService.getCurrentRanking({ option: 'air' })
      setData(rankingData.air_ranking?.reverse() || [])
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

export default AirRanking
