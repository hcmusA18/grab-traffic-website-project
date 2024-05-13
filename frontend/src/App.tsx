import './App.css'
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { MapPage, ChartPage, RankingPage, RootLayout, NotFound, TestPage } from './pages'
import { useInitEnvironData, useInitLocationData } from 'libs/redux'

const App = () => {
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

  return <RouterProvider router={router} />
}

export default App
