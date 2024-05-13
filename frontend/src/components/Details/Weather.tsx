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

export const Weather = () => (
  <div className="flex flex-col rounded-md border-2 border-gray-200 p-4">
    <Item title={'CO'} value={'1.2'} unit={'mg/m3'} />
    <Item title={'NO'} value={'0.02'} unit={'mg/m3'} />
    <Item title={'NO2'} value={'0.01'} unit={'mg/m3'} />
    <Item title={'O3'} value={'0.05'} unit={'mg/m3'} />
    <Item title={'SO2'} value={'0.01'} unit={'mg/m3'} />
    <Item title={'PM2.5'} value={'10'} unit={'µg/m3'} />
    <Item title={'PM10'} value={'20'} unit={'µg/m3'} />
    <Item title={'NH3'} value={'0.01'} unit={'mg/m3'} />
  </div>
)
