import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartDataset
} from 'chart.js'
import { Chart, ChartProps } from 'react-chartjs-2'
import { faker } from '@faker-js/faker'
import type { Dayjs } from 'dayjs'
import { EnviroService } from 'services'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { colors } from 'theme'
import { RootState, useAppSelector } from 'libs/redux'

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  PointElement,
  BarElement,
  LineElement,
  LineController,
  BarController
)

const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  stacked: true,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      size: {
        height: 20,
        width: 20
      }
    },
    title: {
      display: true,
      text: 'Average Traffic and Air Quality Index by Hour'
    },
    datalabels: {
      display: true,
      color: colors.dark,
      align: 'end',
      anchor: 'end'
    }
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      tilte: {
        display: true,
        text: 'Traffic Quality Index'
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        beginAtZero: true,
        max: 100
      },
      title: {
        display: true,
        text: 'Air Quality Index'
      }
    }
  }
} as ChartOptions<'bar'>

export const data = {
  labels,
  datasets: [
    {
      type: 'line' as const,
      label: 'Traffic Quality Index',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 2,
      fill: false,
      data: labels.map(() => faker.number.int({ min: 0, max: 500 }))
    },
    {
      type: 'bar' as const,
      label: 'Air Quality Index',
      backgroundColor: 'rgb(75, 192, 192)',
      data: labels.map(() => faker.number.int({ min: 0, max: 500 })),
      borderColor: 'white',
      borderWidth: 2
    }
  ]
}

interface CombineChartProps {
  location: string // location id
  startDate: Dayjs | null
  endDate: Dayjs | null
}

const getColor = (value: number) => {
  if (value === 0) return 'blue'
  if (value < 50) {
    return colors.green
  } else if (value < 100) {
    return colors.yellow
  } else if (value < 150) {
    return colors.orange
  } else if (value < 200) {
    return colors.red
  } else if (value < 300) {
    return colors.purple
  } else {
    return colors.dark
  }
}

const fetchDailyData = async (location: string, date: string) => {
  const data = await EnviroService.getInstance().getDailyData({ id: location, date })
  return data
}

const fetchWeeklyData = async (location: string, startDate: string, endDate: string) => {
  const data = await EnviroService.getInstance().getRangeData({ id: location, startDate, endDate })
  return data
}

export const CombineChart = ({ location, startDate, endDate }: CombineChartProps) => {
  const environService = useMemo(() => EnviroService.getInstance(), [])
  const { mapLocation } = useAppSelector((state: RootState) => state.data)
  const [chartData, setChartData] = useState<ChartProps['data']>(data)
  const [chartOptions, setChartOptions] = useState<ChartOptions<'bar'>>(defaultChartOptions)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true) // Move setLoading here to ensure it covers the fetch operation
        if (!startDate || !endDate) {
          throw new Error('Start date or end date is not provided.')
        }

        const formattedDate = startDate.format('YYYY-MM-DD')
        const data = startDate.isSame(endDate, 'day')
          ? await fetchDailyData(location, formattedDate)
          : await fetchWeeklyData(location, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'))
        const labels = startDate.isSame(endDate, 'day')
          ? data.map((item: TrafficAirData) => `${item.traffic_data?.hour?.toString().padStart(2, '0')}:00`)
          : Array.from({ length: 7 }, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'))

        const trafficDataset = {
          type: 'line' as const,
          label: 'Traffic',
          borderColor: colors.orange,
          pointBackgroundColor: (context: { raw: number }) => (context.raw ? colors.orange : colors.yellow),
          pointBorderColor: (context: { raw: number }) => (context.raw ? colors.orange : colors.yellow),
          fill: false,
          borderWidth: 4,
          borderJoinStyle: 'round',
          data: data.map((item: TrafficAirData) => item.traffic_data?.traffic_quality_index ?? 0),
          yAxisID: 'y'
        } as ChartDataset

        const airQualityDataset = {
          type: 'bar' as const,
          label: 'Air Quality',
          backgroundColor: (context: { raw: number }) => getColor(context.raw ?? 0),
          borderColor: 'white',
          borderWidth: 2,
          data: data.map((item: TrafficAirData) => item.air_data?.air_quality_index ?? 0),
          yAxisID: 'y1'
        } as ChartDataset

        setChartData({
          labels,
          datasets: [trafficDataset, airQualityDataset]
        })

        setChartOptions({
          ...defaultChartOptions,
          plugins: {
            ...defaultChartOptions.plugins,
            title: {
              display: true,
              text: `${mapLocation.find((loc) => loc.id === parseInt(location))?.place ?? 'Ba Tháng Hai - Sư Vạn Hạnh'} ${startDate.format('YYYY-MM-DD')}${endDate.isSame(startDate, 'day') ? '' : ` to ${endDate.format('YYYY-MM-DD')}`}`
            }
          },
          scales: {
            y: {
              ...defaultChartOptions.scales?.y,
              suggestedMax:
                Math.max(...data.map((item: TrafficAirData) => item.traffic_data?.traffic_quality_index ?? 0)) * 1.3,
              title: {
                display: true,
                text: 'Traffic Quality Index'
              }
            },
            y1: {
              ...defaultChartOptions.scales?.y1,
              suggestedMax:
                Math.max(...data.map((item: TrafficAirData) => item.air_data?.air_quality_index ?? 0)) * 1.3,
              title: {
                display: true,
                text: 'Air Quality Index'
              }
            }
          }
        })
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [location, startDate, endDate, environService, mapLocation])

  useEffect(() => {
    if (mapLocation.length <= 0) setLoading(true)
  }, [mapLocation])

  return (
    <div className="h-[20rem] w-full rounded-md border border-gray-200 md:col-span-8 md:h-[32rem]">
      <Spin spinning={loading} tip="Loading..." fullscreen />
      <Chart ref={chartRef} type="bar" data={chartData} options={chartOptions} />
    </div>
  )
}
