import { useEffect, useState } from 'react'
import { Button, Drawer, Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { MenuOutlined } from '@ant-design/icons'
import { FaHome, FaChartBar } from 'react-icons/fa'
import { useMediaQuery } from 'react-responsive'
import { FaRankingStar } from 'react-icons/fa6'

const menuItems = [
  {
    key: 'map',
    icon: <FaHome />,
    label: <Link to="/">Home</Link>
  },
  {
    key: 'chart',
    icon: <FaChartBar />,
    label: <Link to="/chart">Chart</Link>
  },
  {
    key: 'ranking',
    icon: <FaRankingStar />,
    label: <Link to="/ranking">Ranking</Link>
  }
]

const CustomMenu = ({ mode }: { mode: 'horizontal' | 'inline' }) => {
  const location = useLocation()
  return (
    <Menu
      mode={mode}
      selectedKeys={[location.pathname.split('/')[1] ?? 'map']}
      items={menuItems}
      style={{ lineHeight: '64px' }} // Ensures vertical alignment for horizontal menu
    />
  )
}

const DesktopSidebar = () => (
  <div className="shadow-m sticky top-0 z-50 border-b border-gray-200 bg-white py-3">
    <div className="flex flex-row items-center justify-center px-1 py-0 sm:px-6">
      <div className="float-left w-48">
        <h3 className="inline-block text-lg font-medium capitalize">Traffiker</h3>
      </div>
      <div className="flex w-full flex-col items-center justify-between sm:flex-row">
        <div className="w-full">
          <CustomMenu mode="horizontal" />
        </div>
      </div>
    </div>
  </div>
)

const MobileSidebar = () => {
  const [visible, setVisible] = useState(false)
  const toggleDrawer = () => {
    setVisible(!visible)
  }
  const location = useLocation()
  useEffect(() => {
    setVisible(false)
  }, [location])

  return (
    <div className="absolute left-4 top-4 z-40 bg-transparent">
      <div className="bg-transparent">
        <Button
          className="block h-8 rounded-md border border-gray-300 bg-transparent p-1.5 shadow-md sm:hidden"
          onClick={toggleDrawer}
          icon={<MenuOutlined />}
        />
        <Drawer
          title="Traffiker"
          placement="left"
          closable={true}
          onClose={toggleDrawer}
          open={visible}
          style={{ zIndex: 1000 }}>
          <CustomMenu mode="inline" />
        </Drawer>
      </div>
    </div>
  )
}

export const Sidebar = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })

  return isMobile ? <MobileSidebar /> : <DesktopSidebar />
}
