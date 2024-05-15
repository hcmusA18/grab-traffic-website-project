import { useAppSelector } from 'libs/redux'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import colors from 'tailwindcss/colors'

const colorMap = [colors.green, colors.yellow, colors.orange, colors.rose, colors.purple]
export const AirQuality = () => {
  const { t } = useTranslation()
  const airData = useAppSelector((state) => state.data.currentAirData)
  const [airColor, setAirColor] = useState(colorMap[0])

  const getAirQuality = (airQuality: number) => {
    if (airQuality >= 1 && airQuality < 3) {
      return t('good_quality')
    } else if (airQuality >= 3 && airQuality < 5) {
      return t('moderate_quality')
    } else if (airQuality >= 5) {
      return t('poor_quality')
    }
  }

  useEffect(() => {
    if (airData) {
      setAirColor(colorMap[airData.air_quality ?? 1 - 1])
    }
  }, [airData])
  return (
    <div className={`flex flex-col rounded-t-md p-4 text-white`} style={{ backgroundColor: airColor[500] }}>
      <div className="flex items-center justify-center">
        <h3 className="text-2xl font-semibold">{getAirQuality(airData?.air_quality ?? 1)}</h3>
      </div>
      <div className="flex items-end justify-center align-bottom">
        <h4 className="text-7xl font-semibold">
          {airData?.air_quality_index}
          <span className="text-xl font-light"> AQI</span>
        </h4>
      </div>
      <div
        className={`mx-20 flex flex-row items-center justify-center gap-4 rounded-md bg-white p-2`}
        style={{ color: airColor[700] }}>
        <p className="text-base font-semibold">PM2.5</p>
        <p className="text-base">{airData?.pm2_5} µg/m3</p>
      </div>
    </div>
  )
}

export default AirQuality
