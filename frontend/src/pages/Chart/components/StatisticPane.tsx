import { Statistic, StatisticProps } from 'antd'
import { lazy } from 'react'
const CustomImage = lazy(() => import('components/CustomImage'))
import CountUp from 'react-countup'
import { useTranslation } from 'react-i18next'

const formatter: StatisticProps['formatter'] = (value) => <CountUp end={value as number} separator="." />
const Items = ({ title, value }: { title: string; value: string | number }) => (
  <div className="flex w-full flex-row justify-between space-x-4">
    <span className="text-xl font-medium capitalize">{title}:</span>
    <Statistic value={value} formatter={formatter} className="text-lg " />
  </div>
)

interface StatisticPaneProps {
  className?: string
  location: string
  traffic?: TrafficData
}

export const StatisticPane = ({ className, location, traffic }: StatisticPaneProps) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL
  const { t } = useTranslation()

  return (
    <div className={className ?? ''}>
      {/* <div className="h-48 flex w-full items-center justify-center rounded-md">
        {isImageLoading && <Skeleton.Image active /> }
        <img
          src={`${API_URL}/image/locationID=${location}`}
          alt="location"
          className={`h-full w-full rounded-md object-cover ${isImageLoading ? 'hidden' : ''}`}
          onLoad={() => setIsImageLoading(false)}
        />
      </div> */}
      <CustomImage
        src={`${API_URL}/image/locationID=${location}`}
        alt="location"
        containerClassName="h-48 w-full rounded-md flex items-center justify-center"
        className="h-full w-full rounded-md object-cover"
      />
      {/* <div className="flex w-full items-center justify-between">
        <span className="font-medium md:text-lg">Rush hours</span>
        <span className="text-red-500 md:text-lg">7AM - 9AM</span>
      </div> */}
      {/* <h3 className="text-center text-xl font-bold uppercase">Average</h3> */}
      <div className="flex flex-col items-center justify-between space-y-4 rounded-md px-8 py-2">
        {traffic &&
          Object.entries(traffic).map(
            ([key, value]) => key !== 'average' && <Items key={key} title={t(key)} value={value} />
          )}
      </div>
    </div>
  )
}

export default StatisticPane
