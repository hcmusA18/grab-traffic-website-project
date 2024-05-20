import { Tooltip } from 'antd'
import { lazy } from 'react'
const CustomImage = lazy(() => import('components/CustomImage'))
import { useTranslation } from 'react-i18next'
import { FaMotorcycle } from 'react-icons/fa'
import { FaBicycle, FaBus, FaCar, FaTruck, FaWalkieTalkie } from 'react-icons/fa6'
import Item from 'components/PaneItem'

interface StatisticPaneProps {
  className?: string
  location: string
  traffic?: TrafficData
}

const iconMap = {
  car: <FaCar />,
  bike: <FaBicycle />,
  truck: <FaTruck />,
  bus: <FaBus />,
  person: <FaWalkieTalkie />,
  motorbike: <FaMotorcycle />
}

export const StatisticPane = ({ className, location, traffic }: StatisticPaneProps) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL
  const { t } = useTranslation()

  return (
    <div className={className ?? ''}>
      <CustomImage
        src={`${API_URL}/image/locationID=${location}`}
        alt="location"
        containerClassName="h-48 w-full rounded-md flex items-center justify-center"
        className="h-full w-full rounded-md object-cover"
      />
      <div className="flex flex-col space-y-4 rounded-md py-2">
        <h3 className="text-center font-bold capitalize md:text-2xl">{t('appearance_rate')}</h3>
        {traffic &&
          Object.entries(traffic).map(
            ([key, value]) =>
              key !== 'average' && (
                <Tooltip
                  key={key}
                  title={`1 ${t(key).toLowerCase()} ${t('per')} ${(1 / value).toFixed(2)} ${t('second')}`}
                  placement="top">
                  <Item
                    title={t(key)}
                    value={value.toFixed(2)}
                    unit={t('traffic_unit')}
                    leadingIcon={iconMap[key as keyof typeof iconMap]}
                  />
                </Tooltip>
              )
          )}
      </div>
    </div>
  )
}

export default StatisticPane
