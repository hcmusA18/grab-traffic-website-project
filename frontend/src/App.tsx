import './App.css'
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { useInitEnvironData, useInitLocationData } from 'libs/redux'
import React from 'react'
import { Spin } from 'antd'

// Lazy load pages for better performance
const RootLayout = React.lazy(() => import('./pages/Layout'))
const MapPage = React.lazy(() => import('./pages/Map'))
const ChartPage = React.lazy(() => import('./pages/Chart'))
const RankingPage = React.lazy(() => import('./pages/Ranking'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const TestPage = React.lazy(() => import('./pages/TestPage'))

import 'flag-icons/css/flag-icons.min.css'

const App: React.FC = () => {
  useInitLocationData()
  useInitEnvironData()
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<RootLayout />}>
        <Route element={<Navigate to="/map" />} index />
        <Route element={<MapPage />} path="/map" />
        <Route element={<ChartPage />} path="/chart" />
        <Route element={<RankingPage />} path="/ranking" />
        <Route element={<NotFound />} path="*" />
        <Route element={<TestPage />} path="test" />
      </Route>
    )
  )

  return (
    <React.Suspense fallback={<Spin fullscreen />}>
      <RouterProvider router={router} />
    </React.Suspense>
  )
}

export default App
