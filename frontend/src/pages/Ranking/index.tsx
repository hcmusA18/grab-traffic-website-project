import { useMediaQuery } from 'react-responsive'
import { AirRanking, TrafficRanking, ChangeRanking } from './components'
import { Tabs } from 'antd'

export const RankingPage = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  return (
    <div className="container box-border min-h-screen min-w-full px-3 py-4 md:px-4">
      {!isMobile ? (
        <Tabs defaultActiveKey="air" centered size="large">
          <Tabs.TabPane tab="Air Quality" key="air">
            <AirRanking />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Traffic" key="traffic">
            <TrafficRanking />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Change" key="change">
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
