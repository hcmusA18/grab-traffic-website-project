import { AutoComplete, Segmented } from 'antd'
import { Dayjs } from 'dayjs'
import dayjs from 'libs/utils/dayjsConfig'
import { useCallback, useState } from 'react'
import { CombineChart, DateInput, LocationList, StatisticPane } from './components'
import { debounce } from 'lodash'

import type { DatePickerProps } from 'antd'
import type { RangeValue, CalendarChangeProps } from './components'
import { LocationService } from 'services/LocationService'
import { RootState, useAppSelector } from 'libs/redux'

export const ChartPage = () => {
  const { mapLocation } = useAppSelector((state: RootState) => state.data)
  const [location, setLocation] = useState<string>(mapLocation[0]?.id.toString() ?? '1')
  // default to today
  const [startDate, setStartDate] = useState<Dayjs>(dayjs())
  const [endDate, setEndDate] = useState<Dayjs>(dayjs())
  const [options, setOptions] = useState<{ value: string }[]>([])
  const [isWeekly, setIsWeekly] = useState<boolean>(false)
  const locationService = LocationService.getInstance()

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

  return (
    <div className="container grid h-full w-full grid-cols-1 gap-4 py-2 md:grid-cols-12">
      {/* Input section */}
      <div className="col-span-full flex flex-col items-center justify-between gap-2 md:flex-row md:gap-0 md:space-x-4">
        <AutoComplete
          options={options}
          className="w-full"
          onChange={searchHandler}
          onSelect={selectHandler}
          defaultValue={options[0]?.value}
          placeholder="Enter location"
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
          options={['Daily', 'Weekly']}
          value={isWeekly ? 'Weekly' : 'Daily'}
          onChange={(value) => setIsWeekly(value === 'Weekly')}
        />
      </div>
      {/* Chart and statistics section */}
      <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-12">
          <CombineChart location={location} startDate={startDate} endDate={endDate} />
          <StatisticPane
            className="border-1 col-span-1 rounded-md border border-gray-200 p-8 md:col-span-4"
            location={location}
          />
        </div>
        <LocationList locationId={location} onChangeLocation={setLocation} />
      </div>
    </div>
  )
}
