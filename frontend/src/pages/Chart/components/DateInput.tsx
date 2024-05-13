import { DatePicker, DatePickerProps } from 'antd'
import dayjs from 'libs/utils/dayjsConfig'
import type { Dayjs } from 'dayjs'
import type { BaseInfo } from 'rc-picker/lib/interface'

const { RangePicker } = DatePicker
const dateFormat = 'DD/MM/YYYY'
export type RangeValue = [Dayjs | null, Dayjs | null] | null
export type CalendarChangeProps = (
  dates: RangeValue | Dayjs | Dayjs[],
  dateStrings: [string, string] | string | string[],
  info: BaseInfo
) => void
interface DateInputProps {
  className?: string
  isWeekly: boolean
  onChange: CalendarChangeProps
  disableDate: DatePickerProps['disabledDate']
  defaultPickerDate?: [Dayjs, Dayjs]
  defaultDate?: Dayjs
}

export const DateInput: React.FC<DateInputProps> = ({
  className,
  isWeekly,
  onChange,
  disableDate,
  defaultPickerDate,
  defaultDate
}: DateInputProps) => {
  return isWeekly ? (
    <RangePicker
      className={className ?? ''}
      format={dateFormat}
      onCalendarChange={onChange}
      disabledDate={disableDate}
      defaultValue={defaultPickerDate}
      maxDate={dayjs().add(7, 'day')}
    />
  ) : (
    <DatePicker
      className={className ?? ''}
      format={dateFormat}
      onCalendarChange={onChange}
      disabledDate={disableDate}
      defaultValue={defaultDate}
      maxDate={dayjs().add(7, 'day')}
    />
  )
}
