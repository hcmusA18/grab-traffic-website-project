import { useMediaQuery } from 'react-responsive'
import { lazy } from 'react'
const AirRanking = lazy(() => import('./components/AirRanking'))
const TrafficRanking = lazy(() => import('./components/TrafficRanking'))
const ChangeRanking = lazy(() => import('./components/ChangeRanking'))
import { Tabs } from 'antd'
import { useTranslation } from 'react-i18next'

export const RankingPage = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  const { t } = useTranslation()
  return (
    <div className="container box-border min-h-screen min-w-full px-3 py-4 md:px-4">
      {!isMobile ? (
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
      ) : (
        <div className="flex flex-col space-y-4">
          <AirRanking />
          <TrafficRanking />
          <ChangeRanking />
        </div>
      )}
    </div>
  )
}

export default RankingPage
