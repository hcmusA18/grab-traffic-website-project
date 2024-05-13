import {
  useAppDispatch,
  useAppSelector,
  setShowDetails,
  useInitEnvironData,
  setCurrentAirData,
  setCurrentTrafficData,
  setCurrentLocationID
} from 'libs/redux'
import React, { useEffect, useState } from 'react'
import { FaChevronRight } from 'react-icons/fa'
import { Spin, Tabs, TabsProps, theme } from 'antd'
import StickyBox from 'react-sticky-box'
import dayjs from 'libs/utils/dayjsConfig'
import { AirQuality } from './AirQuality'
import { Weather } from './Weather'
import { Traffic } from './Traffic'

const CustomTabPane: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex flex-col gap-4">{children}</div>
}

const CustomTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => {
  const {
    token: { colorBgContainer }
  } = theme.useToken()
  return (
    <StickyBox offsetTop={64} offsetBottom={20} style={{ zIndex: 10 }}>
      <DefaultTabBar
        {...props}
        style={{ background: colorBgContainer }}
        className="text-md ring-offset-opacity-50 ring-offset-solid ring-offset-opacity-50 ring-offset-solid inline-flex items-center justify-between whitespace-nowrap rounded-sm px-3 py-1.5 font-bold uppercase ring-offset-2 ring-offset-background transition-all duration-300 ease-in-out"
      />
    </StickyBox>
  )
}

export const Details = () => {
  const dispatch = useAppDispatch()
  const { showDetails, district } = useAppSelector((state) => state.page)
  const [isLoading, setIsLoading] = useState(true)
  const [trafficData, airData] = useAppSelector((state) => [state.data.currentTrafficData, state.data.currentAirData])
  const className =
    'bg-white transition-[margin-right] ease-in-out duration-500 fixed md:static top-0 bottom-0 right-0 z-40 p-4 w-full sm:w-[526px] text-black'
  const appendClass = showDetails ? ' mr-0' : ' hidden'

  useInitEnvironData()

  useEffect(() => {
    if (trafficData && airData) {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [trafficData, airData])

  const tabsItems = [
    {
      key: 'airq',
      label: 'Air Quality',
      children: (
        <CustomTabPane key="airq">
          <Spin spinning={isLoading} size="large" tip="Loading...">
            <AirQuality />
            <Weather />
          </Spin>
        </CustomTabPane>
      )
    },
    {
      key: 'traffic',
      label: 'Traffic',
      children: (
        <CustomTabPane key="traffic">
          <Traffic />
        </CustomTabPane>
      )
    }
  ]

  return (
    <div className={`${className}${appendClass}`}>
      <div className="flex flex-col">
        <div className="flex justify-between">
          {/* dummy div to center the text */}
          <div></div>
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-lg font-bold">{district}</h2>
            <p className="text-xs leading-3">{dayjs().format('HH:mm DD/MM/YYYY')}</p>
          </div>
          <button
            onClick={() => {
              dispatch(setShowDetails({ showDetails: false, district: null }))
              dispatch(setCurrentAirData(undefined))
              dispatch(setCurrentTrafficData(undefined))
              dispatch(setCurrentLocationID(-1))
            }}
            className="text-xl font-bold">
            <FaChevronRight />
          </button>
        </div>

        <Tabs defaultActiveKey="airq" centered items={tabsItems} renderTabBar={CustomTabBar} />
      </div>
    </div>
  )
}
