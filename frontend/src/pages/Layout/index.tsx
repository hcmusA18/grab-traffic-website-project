import { Sidebar } from 'components/Sidebar'
import { Outlet } from 'react-router-dom'

export const RootLayout = () => {
  return (
    <div className="flex w-full flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default RootLayout
