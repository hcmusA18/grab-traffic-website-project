import { useAppSelector } from 'libs/redux'

export const AirQuality = () => {
  const airData = useAppSelector((state) => state.data.currentAirData)

  const getAirQualityColor = (airQuality: number) => {
    const colorMap = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500']
    return colorMap[airQuality - 1]
  }

  const getAirQuality = (airQuality: number) => {
    if (airQuality >= 1 && airQuality < 3) {
      return 'Good quality'
    } else if (airQuality >= 3 && airQuality < 5) {
      return 'Moderate quality'
    } else if (airQuality >= 5) {
      return 'Poor quality'
    }
  }

  return (
    <div className={`flex flex-col rounded-t-md p-4 text-white ${getAirQualityColor(airData?.air_quality ?? 1)}`}>
      <div className="flex items-center justify-center">
        <h3 className="text-2xl font-semibold">{getAirQuality(airData?.air_quality ?? 1)}</h3>
      </div>
      <div className="flex items-end justify-center align-bottom">
        <h4 className="text-7xl font-semibold">
          {airData?.air_quality_index}
          <span className="text-xl font-light"> AQI</span>
        </h4>
      </div>
      <div className="mx-20 flex flex-row items-center justify-center gap-4 rounded-md bg-white p-2 text-green-700">
        <p className="text-base font-semibold">PM2.5</p>
        <p className="text-base">{airData?.pm2_5} µg/m3</p>
      </div>
    </div>
  )
}

export default AirQuality
