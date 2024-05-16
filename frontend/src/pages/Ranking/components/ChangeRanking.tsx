import { useEffect, useState } from 'react'
import { RankingBoard } from './RankingBoard'
import { RankingService } from 'services/RankingService'
import { useTranslation } from 'react-i18next'
import colors from 'tailwindcss/colors'

export const ChangeRanking = () => {
  const [data, setData] = useState<Ranking[]>([])
  const rankingService = RankingService.getInstance()
  const { t } = useTranslation()

  const rankingOptions = {
    title: t('change_ranking'),
    columns: [
      { title: t('location'), key: 'location' as keyof Ranking },
      { title: t('air_quality_percent_change'), key: 'value' as keyof Ranking }
    ],
    color: [
      { range: [-9999, 0] as [number, number], color: colors.green[500] },
      { range: [0, 2] as [number, number], color: colors.yellow[500] },
      { range: [2, 4] as [number, number], color: colors.orange[500] },
      { range: [4, 9999] as [number, number], color: colors.red[500] }
    ]
  }

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

export default ChangeRanking
