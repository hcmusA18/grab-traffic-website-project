import { Spin } from 'antd'
import { useAppSelector } from 'libs/redux'
import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const useLocationImage = () => {
  const locationID = useAppSelector((state) => state.data.currentLocationID)
  const locations = useAppSelector((state) => state.data.mapLocation)
  const urlImage = locations.find((location) => location.id === locationID)?.request

  return urlImage
}

export const Traffic = () => {
  const { currentTrafficData: trafficData } = useAppSelector((state) => state.data)
  const [isLoading, setIsLoading] = useState(true)
  const urlImage = useLocationImage()
  const [data, setData] = useState<ChartData<'doughnut'>['datasets']>([])
  const [isImageLoading, setIsImageLoading] = useState(true)
  const labels = ['Car', 'Motorbike', 'Bus', 'Truck', 'Pedestrian', 'Bicycle']

  useEffect(() => {
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
  }, [trafficData])

  useEffect(() => {
    if (trafficData) {
      setIsLoading(false)
    }
  }, [trafficData])

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  return (
    <Spin spinning={isLoading} size="large" tip="Loading...">
      <div className="flex flex-col items-center space-y-4">
        {urlImage && (
          <div className="relative">
            <img
              src={urlImage}
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
