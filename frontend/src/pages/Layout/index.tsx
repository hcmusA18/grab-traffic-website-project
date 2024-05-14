import { Sidebar } from 'components/Sidebar'
import { Outlet } from 'react-router-dom'

export const RootLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default RootLayout
