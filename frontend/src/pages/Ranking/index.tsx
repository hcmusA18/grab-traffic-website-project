import { useMediaQuery } from 'react-responsive'
import { lazy } from 'react'
const AirRanking = lazy(() => import('./components/AirRanking'))
const TrafficRanking = lazy(() => import('./components/TrafficRanking'))
const ChangeRanking = lazy(() => import('./components/ChangeRanking'))
import { Tabs, Select, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { setNumberShow, setRankDecrease, useAppDispatch, useAppSelector } from 'libs/redux'
import { HiOutlineSortDescending, HiOutlineSortAscending } from 'react-icons/hi'

const { Option } = Select

export const RankingPage = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const numberShow = useAppSelector((state) => state.data.numberShow)
  const rankDecrease = useAppSelector((state) => state.data.rankDecrease)

  const handleChange = (value: number) => {
    dispatch(setNumberShow(value))
  }

  const handleRankChange = () => {
    dispatch(setRankDecrease(!rankDecrease))
  }

  const mobileOptions = [5, 10, 15]
  const desktopOptions = [5, 10, 15, 20]

  return (
    <div className="container box-border min-h-screen min-w-full px-3 py-4 md:px-4">
      {!isMobile ? (
        <div>
          <Tabs defaultActiveKey="air" centered size="large">
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
          <div
            className="mt-2 text-right"
            style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
