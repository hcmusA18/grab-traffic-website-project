import { useAppSelector } from 'libs/redux'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCloudSun, FaSmog, FaTemperatureLow, FaWind } from 'react-icons/fa6'
import { EnviroService } from 'services/EnviroService'
import colors from 'tailwindcss/colors'

interface ItemProps {
  leadingIcon?: React.ReactNode
  title: string
  value: string
  unit?: string
}

const Item: React.FC<ItemProps> = ({ leadingIcon, title, value, unit }: ItemProps) => (
  <div className="flex flex-row items-center justify-between p-2">
    <div className="flex flex-row items-center gap-2">
      {leadingIcon}
      <p className="text-base font-semibold">{title}</p>
    </div>
    <p className="text-base">
      <span className="font-bold">{value}</span> <span>{unit}</span>
    </p>
  </div>
)
const colorMap = [colors.green, colors.yellow, colors.orange, colors.rose, colors.purple]
export const AirQuality = () => {
  const { t } = useTranslation()
  const { currentAirData: airData, mapLocation, currentLocationID } = useAppSelector((state) => state.data)
  const { long, lat } = mapLocation.find((location) => location.id === currentLocationID) || { long: 0, lat: 0 }
  const [airColor, setAirColor] = useState(colorMap[0])
  const [weatherText, setWeatherText] = useState('')
  const [temperature, setTemperature] = useState(0)
  const [humidity, setHumidity] = useState(0)
  const [windSpeed, setWindSpeed] = useState(0)

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
    if (currentLocationID !== -1) {
      EnviroService.getInstance()
        .getWeatherData(currentLocationID.toString())
        .then((data) => {
          setWeatherText(data.WeatherText)
          setTemperature(data.Temperature.Metric.Value)
          setHumidity(data.RelativeHumidity)
          setWindSpeed(data.Wind.Speed.Metric.Value)
        })
    }
  }, [currentLocationID, lat, long])

  useEffect(() => {
    if (airData) {
      setAirColor(colorMap[(airData.air_quality ?? 1) - 1])
    }
  }, [airData])

  return (
    <div className="flex flex-col rounded-t-md border-x" style={{ borderColor: airColor[500] }}>
      <div
        className={`flex flex-col rounded-t-md pb-4 pl-4 pr-4 pt-2 text-white`}
        style={{ backgroundColor: airColor[500] }}>
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
      <Item title={t('weather')} value={weatherText} leadingIcon={<FaCloudSun className="text-xl" />} />
      <Item
        title={`${t('temperature')}`}
        value={`${temperature}`}
        unit="°C"
        leadingIcon={<FaTemperatureLow className="text-xl" />}
      />
      <Item title={`${t('humidity')}`} value={`${humidity}`} unit="%" leadingIcon={<FaSmog className="text-xl" />} />
      <Item
        title={`${t('wind_speed')}`}
        value={`${windSpeed}`}
        unit="km/h"
        leadingIcon={<FaWind className="text-xl" />}
      />
    </div>
  )
}

export default AirQuality
