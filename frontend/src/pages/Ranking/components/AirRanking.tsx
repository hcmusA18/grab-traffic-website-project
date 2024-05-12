import { fakerVI } from '@faker-js/faker'
import { RankingBoard } from './RankingBoard'
import { useEffect, useState } from 'react'
import { colors } from 'theme'

const rankingData = Array.from({ length: fakerVI.number.int({ min: 10, max: 20 }) }, () => ({
  location: fakerVI.location.city(),
  value: fakerVI.number.int({ min: 0, max: 350 })
}))

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
  const [data, setData] = useState<Ranking[]>(rankingData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((data) => {
        const newData = data.map((item) => ({
          ...item,
          value: item.value + fakerVI.number.int({ min: -10, max: 10 })
        }))
        return newData
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="box-border rounded-md border px-2">
      <RankingBoard ranking={data} options={rankingOptions} />
    </div>
  )
}
