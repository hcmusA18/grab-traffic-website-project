import { useAppSelector } from 'libs/redux'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export const Weather = () => {
  const weatherData = useAppSelector((state) => state.data.currentAirData)
  const [data, setData] = useState<ChartData<'radar'>['datasets']>([])
  const labels = ['NO', 'NO2', 'SO2', 'PM2.5', 'PM10', 'NH3']
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (weatherData) {
      const values = [
        weatherData.no,
        weatherData.no2,
        weatherData.so2,
        weatherData.pm2_5,
        weatherData.pm10,
        weatherData.nh3
      ] as number[]
      setData([
        {
          label: t('air_quality'),
          data: values,
          fill: true,
          backgroundColor: 'rgba(75,192,192,0.2)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1
        }
      ])
    }
  }, [weatherData, t, i18n.language])

  return (
    <div className="flex flex-col rounded-b-md border-2 border-gray-200 p-4">
      <Radar
        data={{ labels: labels, datasets: data }}
        options={{
          plugins: {
            tooltip: {
              callbacks: {
                label: (context: TooltipItem<'radar'>) => {
                  const units = ['mg/m3', 'mg/m3', 'mg/m3', 'µg/m3', 'µg/m3', 'mg/m3']
                  return `${context.raw} ${units[context.dataIndex]}`
                }
              }
            }
          }
        }}
      />
    </div>
  )
}

export default Weather
