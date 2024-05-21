import { useMediaQuery } from 'react-responsive'
import { lazy } from 'react'
const AirRanking = lazy(() => import('./components/AirRanking'))
const TrafficRanking = lazy(() => import('./components/TrafficRanking'))
const ChangeRanking = lazy(() => import('./components/ChangeRanking'))
import { Tabs, Select, Button, TabsProps, theme } from 'antd'
import { useTranslation } from 'react-i18next'
import { setNumberShow, setRankDecrease, useAppDispatch, useAppSelector } from 'libs/redux'
import { HiOutlineSortDescending, HiOutlineSortAscending } from 'react-icons/hi'
import StickyBox from 'react-sticky-box'

const { Option } = Select

const CustomTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => {
  const dispatch = useAppDispatch()
  const {
    token: { colorBgContainer }
  } = theme.useToken()
  const numberShow = useAppSelector((state) => state.data.numberShow)
  const rankDecrease = useAppSelector((state) => state.data.rankDecrease)
  const handleRankChange = () => {
    dispatch(setRankDecrease(!rankDecrease))
  }
  const handleChange = (value: number) => {
    dispatch(setNumberShow(value))
  }
  const desktopOptions = [5, 10, 15, 20]

  return (
    <StickyBox offsetTop={64} offsetBottom={20} style={{ zIndex: 10 }}>
      <div className="grid grid-cols-3">
        <DefaultTabBar
          {...props}
          style={{ background: colorBgContainer, justifySelf: 'center' }}
          className="text-md ring-offset-opacity-50 ring-offset-solid ring-offset-opacity-50 ring-offset-solid col-span-1 col-start-2 inline-flex items-center justify-between whitespace-nowrap rounded-sm px-3 py-1.5 font-bold uppercase ring-offset-2 ring-offset-background transition-all duration-300 ease-in-out"
        />
        <div className="flex items-center justify-end text-right">
          <Button style={{ height: 34 }} onClick={handleRankChange}>
            {rankDecrease ? <HiOutlineSortDescending /> : <HiOutlineSortAscending />}
          </Button>
          <Select defaultValue={numberShow} style={{ width: 80, height: 34 }} onChange={handleChange}>
            {desktopOptions.map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Select>
        </div>
      </div>
    </StickyBox>
  )
}

export const RankingPage = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const handleChange = (value: number) => {
    dispatch(setNumberShow(value))
  }
  const numberShow = useAppSelector((state) => state.data.numberShow)
  const rankDecrease = useAppSelector((state) => state.data.rankDecrease)
  const handleRankChange = () => {
    dispatch(setRankDecrease(!rankDecrease))
  }

  const mobileOptions = [5, 10, 15]

  return (
    <div className="container box-border min-h-screen min-w-full px-3 py-4 md:px-4">
      {!isMobile ? (
        <Tabs defaultActiveKey="air" centered size="large" renderTabBar={CustomTabBar} className="flex">
          <Tabs.TabPane tab={t('air_quality')} key="air">
            <AirRanking />
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('traffic')} key="traffic">
            <TrafficRanking />
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('change')} key="change">
            <ChangeRanking />
          </Tabs.TabPane>
        </Tabs>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="text-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button style={{ height: 34 }} onClick={handleRankChange}>
              {rankDecrease ? <HiOutlineSortDescending /> : <HiOutlineSortAscending />}
            </Button>
            <Select defaultValue={numberShow} style={{ width: 80, height: 34 }} onChange={handleChange}>
              {mobileOptions.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </div>
          <AirRanking />
          <TrafficRanking />
          <ChangeRanking />
        </div>
      )}
    </div>
  )
}

export default RankingPage
