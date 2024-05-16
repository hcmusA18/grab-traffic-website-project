import { Spin } from 'antd'
import { useAppSelector } from 'libs/redux'
import { lazy, useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import colors from 'tailwindcss/colors'
const CustomImage = lazy(() => import('components/CustomImage'))

ChartJS.register(ArcElement, Tooltip, Legend)

export const Traffic = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL
  const locationID = useAppSelector((state) => state.data.currentLocationID)
  const { currentTrafficData: trafficData } = useAppSelector((state) => state.data)
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ChartData<'doughnut'>['datasets']>([])
  const { t, i18n } = useTranslation()
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    setLabels(['Car', 'Motorbike', 'Bus', 'Truck', 'Pedestrian', 'Bicycle'].map((label) => t(label)))

    if (trafficData) {
      const values = [
        trafficData.car,
        trafficData.motorbike,
        trafficData.bus,
        trafficData.truck,
        trafficData.person,
        trafficData.bike
      ] as number[]
      setData([
        {
          label: 'Number: ',
          data: values,
          backgroundColor: [
            colors.rose[400],
            colors.blue[400],
            colors.yellow[400],
            colors.orange[400],
            colors.green[400],
            colors.cyan[400]
          ],
          borderColor: 'rgba(55,100,100,0.2)',
          borderWidth: 1,
          hoverOffset: 4
        }
      ])
    }
  }, [trafficData, i18n.language, t])

  useEffect(() => {
    if (trafficData) {
      setIsLoading(false)
    }
  }, [trafficData])

  return (
    <Spin spinning={isLoading} size="large" tip={t('loading...')}>
      <div className="flex flex-col items-center space-y-4">
        {locationID !== -1 && (
          <CustomImage
            src={API_URL + `/image/locationID=${locationID}`}
            alt="camera"
            containerClassName="h-42 w-full rounded-md flex items-center justify-center"
            className="rounded-md"
          />
        )}
        <div className="h-full w-full">
          <Doughnut
            key={i18n.language}
            data={{ labels, datasets: data }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'right'
                },
                title: {
                  display: true,
                  text: 'Traffic Statistics',
                  color: 'black',
                  font: {
                    size: 20,
                    weight: 'bold'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </Spin>
  )
}

export default Traffic
