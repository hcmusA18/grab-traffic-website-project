import { AutoComplete, Segmented, Spin } from 'antd'
import { Dayjs } from 'dayjs'
import dayjs from 'libs/utils/dayjsConfig'
import { lazy, useCallback, useEffect, useState } from 'react'
const CombineChart = lazy(() => import('./components/CombineChart'))
const DateInput = lazy(() => import('./components/DateInput'))
const LocationList = lazy(() => import('./components/LocationList'))
// const StatisticPane = lazy(() => import('./components/StatisticPane'))
import StatisticPane from './components/StatisticPane'

import { debounce } from 'lodash'

import type { DatePickerProps } from 'antd'
import type { RangeValue, CalendarChangeProps } from './components'
import { LocationService } from 'services/LocationService'
import { RootState, useAppSelector } from 'libs/redux'
import { EnviroService } from 'services/EnviroService'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

const fetchDailyData = async (location: string, date: string) => {
  const data = await EnviroService.getInstance().getDailyData({ id: location, date })
  return data
}

const fetchWeeklyData = async (location: string, date: string, range: number) => {
  const data = await EnviroService.getInstance().getRangeData({ id: location, date: date, range: range })
  return data
}

export const ChartPage = () => {
  const { mapLocation } = useAppSelector((state: RootState) => state.data)
  const [location, setLocation] = useState<string>(mapLocation[0]?.id.toString() ?? '1')
  const [locationName, setLocationName] = useState<string>(
    mapLocation.find((loc) => loc.id.toString() === location)?.place ?? 'Ba Tháng Hai - Sư Vạn Hạnh'
  )
  // default to today
  const [startDate, setStartDate] = useState<Dayjs>(dayjs())
  const [endDate, setEndDate] = useState<Dayjs>(dayjs())
  const [options, setOptions] = useState<{ value: string }[]>([])
  const [isWeekly, setIsWeekly] = useState<boolean>(false)
  const locationService = LocationService.getInstance()
  const [data, setData] = useState<TrafficAirData[]>([])
  const [trafficData, setTrafficData] = useState<TrafficData>()
  const [labels, setLabels] = useState<string[]>([])
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const { t } = useTranslation()

  const selectHandler = async (data: string) => {
    const value = await locationService.searchLocationByName({ keyword: data })
    setLocation(value[0].id.toString())
  }

  const debounceSearch = debounce(async (searchText: string) => {
    const value = await locationService.autofillLocationByName({ keyword: searchText })
    setOptions(value.map((v) => ({ value: v.place })))
  }, 500)

  const searchCallback = useCallback(
    (searchText: string) => {
      debounceSearch(searchText)
    },
    [debounceSearch]
  )

  const searchHandler = useCallback(
    async (searchText: string) => {
      searchCallback(searchText)
    },
    [searchCallback]
  )

  const disableDate: DatePickerProps['disabledDate'] = (current, { from }) => {
    if (from) {
      return Math.abs(current.diff(from, 'days')) > 7
    }
    return false
  }

  const handleChangeRange: CalendarChangeProps = (selectedDates, _, __) => {
    const dates = selectedDates as RangeValue
    if (dates) {
      setStartDate(dates[0] as Dayjs)
      setEndDate(dates[1] as Dayjs)
    }
  }
  const handleChangeDate: CalendarChangeProps = (date, _, __) => {
    if (date) {
      setStartDate(date as Dayjs)
      setEndDate(date as Dayjs)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true)
        if (!startDate || !endDate) {
          throw new Error('Start date or end date is not provided.')
        }

        const formattedDate = startDate.format('YYYY-MM-DD')
        const rawData = startDate.isSame(endDate, 'day')
          ? await fetchDailyData(location, formattedDate)
          : await fetchWeeklyData(
              location,
              endDate.format('YYYY-MM-DD'),
              Math.min(Math.abs(startDate.diff(endDate, 'day')) + 1, 7)
            )
        setData(rawData.chartData)
        const labels = startDate.isSame(endDate, 'day')
          ? rawData.chartData.map(
              (item: TrafficAirData) => `${item.traffic_data?.hour?.toString().padStart(2, '0')}:00`
            )
          : Array.from({ length: Math.min(Math.abs(startDate.diff(endDate, 'day')) + 1, 7) }, (_, i) =>
              startDate.add(i, 'day').format('YYYY-MM-DD')
            )
        setLabels(labels)

        setTrafficData(rawData.traffic)
      } catch (error) {
        console.error('Error fetching environ data:', error)
      } finally {
        setIsFetching(false)
      }
    }
    setLocationName(mapLocation.find((loc) => loc.id.toString() === location)?.place ?? 'Ba Tháng Hai - Sư Vạn Hạnh')
    fetchData()
  }, [location, startDate, endDate, mapLocation, isWeekly])

  return (
    <div className="container grid h-full w-full grid-cols-1 gap-4 py-2 md:grid-cols-12">
      <Spin spinning={isFetching} fullscreen tip={t('loading...')} />
      {/* Input section */}
      <div className="col-span-full flex flex-col items-center justify-between gap-2 md:flex-row md:gap-0 md:space-x-4">
        <AutoComplete
          options={options}
          className="w-full"
          onChange={searchHandler}
          onSelect={selectHandler}
          defaultValue={options[0]?.value}
          placeholder={t('enter_location')}
        />
        <DateInput
          className="w-full"
          isWeekly={isWeekly}
          onChange={isWeekly ? handleChangeRange : handleChangeDate}
          disableDate={disableDate}
          defaultPickerDate={[startDate, endDate]}
          defaultDate={startDate}
        />
        <Segmented
          className="self-auto "
          options={[t('daily'), t('weekly')]}
          value={isWeekly ? t('weekly') : t('daily')}
          onChange={(value) => setIsWeekly(value === t('weekly'))}
        />
      </div>
      {/* Chart and statistics section */}
      <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-12">
          <CombineChart
            location={locationName}
            rawData={data}
            labels={labels}
            startDate={startDate}
            endDate={endDate}
            key={i18n.language}
          />
          <StatisticPane
            className="border-1 col-span-1 rounded-md border border-gray-200 p-8 md:col-span-4"
            location={location}
            traffic={trafficData}
          />
        </div>
        <LocationList locationId={location} onChangeLocation={setLocation} />
      </div>
    </div>
  )
}

export default ChartPage
