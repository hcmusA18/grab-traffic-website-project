import { Spin } from 'antd'
import { useAppSelector } from 'libs/redux'
import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'

ChartJS.register(ArcElement, Tooltip, Legend)

export const Traffic = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL
  const locationID = useAppSelector((state) => state.data.currentLocationID)
  const { currentTrafficData: trafficData } = useAppSelector((state) => state.data)
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ChartData<'doughnut'>['datasets']>([])
  const [isImageLoading, setIsImageLoading] = useState(true)
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
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF5733', '#33FF57', '#33FFC7'],
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

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  return (
    <Spin spinning={isLoading} size="large" tip={t('loading...')}>
      <div className="flex flex-col items-center space-y-4">
        {locationID !== -1 && (
          <div className="relative">
            <img
              src={API_URL + `/image/locationID=${locationID}`}
              style={{ objectFit: 'cover' }}
              className="rounded-md"
              alt="camera"
              onLoad={handleImageLoad}
            />
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-gray-200 bg-opacity-50">
                <Spin size="large" />
              </div>
            )}
          </div>
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
