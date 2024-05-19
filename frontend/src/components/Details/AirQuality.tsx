import { useAppSelector } from 'libs/redux'
import { lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCloudSun, FaSmog, FaTemperatureLow, FaWind } from 'react-icons/fa6'
import { EnviroService } from 'services/EnviroService'
import { airColorMap, airQualityConfig } from 'libs/utils/constant'
import { getColorForValue } from 'libs/utils/helper'
const Item = lazy(() => import('components/PaneItem'))

export const AirQuality = () => {
  const { t } = useTranslation()
  const { currentAirData: airData, mapLocation, currentLocationID } = useAppSelector((state) => state.data)
  const { long, lat } = mapLocation.find((location) => location.id === currentLocationID) || { long: 0, lat: 0 }
  const [weatherText, setWeatherText] = useState('')
  const [temperature, setTemperature] = useState(0)
  const [humidity, setHumidity] = useState(0)
  const [windSpeed, setWindSpeed] = useState(0)

  const getAirQuality = (airQualityIndex: number) => {
    for (const [key, value] of Object.entries(airQualityConfig)) {
      if (
        value &&
        airQualityIndex >= value.min &&
        airQualityIndex <= value.max &&
        Object.keys(airQualityConfig).indexOf(key) <= airQualityIndex
      ) {
        return t(`${key}_quality`)
      }
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

  return (
    <div
      className="flex flex-col rounded-t-md border-x"
      style={{ borderColor: getColorForValue(airData?.air_quality_index as number, airColorMap) }}>
      <div
        className={`flex flex-col rounded-t-md pb-4 pl-4 pr-4 pt-2 text-white`}
        style={{ backgroundColor: getColorForValue(airData?.air_quality_index as number, airColorMap), opacity: 0.8 }}>
        <div className="flex items-center justify-center">
          <h3 className="text-2xl font-semibold">{getAirQuality(airData?.air_quality_index as number)}</h3>
        </div>
        <div className="flex items-end justify-center align-bottom">
          <h4 className="text-7xl font-semibold">
            {airData?.air_quality_index}
            <span className="text-xl font-light"> AQI</span>
          </h4>
        </div>
        <div
          className={`mx-20 flex flex-row items-center justify-center gap-4 rounded-md bg-white p-2 bg-blend-darken`}
          style={{
            color: getColorForValue(airData?.air_quality_index as number, airColorMap)
          }}>
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
