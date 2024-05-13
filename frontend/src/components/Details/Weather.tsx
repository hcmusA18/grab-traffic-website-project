import { useAppSelector } from 'libs/redux'
import React from 'react'

interface ItemProps {
  leadingIcon?: React.ReactNode
  title: string
  value: string
  unit?: string
}

const Item: React.FC<ItemProps> = ({ leadingIcon, title, value, unit }) => (
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

export const Weather = () => {
  const weatherData = useAppSelector((state) => state.data.currentAirData)

  return (
    <div className="flex flex-col rounded-md border-2 border-gray-200 p-4">
      <Item title={'CO'} value={weatherData?.co?.toString() ?? ''} unit={'mg/m3'} />
      <Item title={'NO'} value={weatherData?.no?.toString() ?? ''} unit={'mg/m3'} />
      <Item title={'NO2'} value={weatherData?.no2?.toString() ?? ''} unit={'mg/m3'} />
      <Item title={'O3'} value={weatherData?.o3?.toString() ?? ''} unit={'mg/m3'} />
      <Item title={'SO2'} value={weatherData?.so2?.toString() ?? ''} unit={'mg/m3'} />
      <Item title={'PM2.5'} value={weatherData?.pm2_5?.toString() ?? ''} unit={'µg/m3'} />
      <Item title={'PM10'} value={weatherData?.pm10?.toString() ?? ''} unit={'µg/m3'} />
      <Item title={'NH3'} value={weatherData?.nh3?.toString() ?? ''} unit={'mg/m3'} />
    </div>
  )
}
