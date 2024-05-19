import { Sidebar } from 'components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

export const RootLayout = () => {
  return (
    <div className="flex w-full flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <Analytics />
      <SpeedInsights />
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default RootLayout
