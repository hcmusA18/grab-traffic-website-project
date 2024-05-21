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
  ChartData
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { faker } from '@faker-js/faker'
import type { Dayjs } from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { Spin } from 'antd'
import colors from 'tailwindcss/colors'
import { useTranslation } from 'react-i18next'
import { getColorForValue } from 'libs/utils/helper'
import { airColorMap } from 'libs/utils/constant'

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
      },
      backgroundColor: colors.gray[100]
    },
    title: {
      display: true,
      text: 'Average Traffic and Air Quality Index by Hour'
    },
    datalabels: {
      display: true,
      color: colors.gray[900],
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
        text: 'Air Quality Index'
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
        text: 'Traffic Quality Index'
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
} as ChartData<'bar'>

interface CombineChartProps {
  location: string
  rawData: TrafficAirData[]
  labels: string[]
  startDate: Dayjs
  endDate: Dayjs
}

const trafficColorMap = [
  { range: [0, 5.99] as [number, number], color: colors.cyan[200] },
  { range: [6, 10.99] as [number, number], color: colors.cyan[300] },
  { range: [11, 15.99] as [number, number], color: colors.cyan[400] },
  { range: [16, 20.99] as [number, number], color: colors.cyan[500] },
  { range: [21, 25.99] as [number, number], color: colors.cyan[600] },
  { range: [26, 9999] as [number, number], color: colors.cyan[700] }
]

export const CombineChart = ({ location, rawData, labels, startDate, endDate }: CombineChartProps) => {
  const [chartData, setChartData] = useState<ChartData<'bar' | 'line'>>(data)
  const [chartOptions, setChartOptions] = useState<ChartOptions<'bar'>>(defaultChartOptions)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef(null)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const airQualityDataset = {
          type: 'line' as const,
          label: t('air_quality'),
          pointRadius: 4,
          borderColor: colors.slate[400],
          borderDash: [5, 5],
          pointBackgroundColor: (context: { raw: number }) =>
            context.raw ? getColorForValue(context.raw, airColorMap) : 'transparent',
          pointBorderColor: (context: { raw: number }) =>
            context.raw ? getColorForValue(context.raw, airColorMap) : 'transparent',
          pointBorderWidth: 2,
          pointHoverBorderColor: colors.slate[400],
          borderWidth: 2,
          pointHoverRadius: 8,
          pointHitRadius: 4,
          borderJoinStyle: 'round',
          data: rawData.map((item: TrafficAirData) => item.air_data?.air_quality_index ?? 0),
          yAxisID: 'y'
        } as ChartData<'line'>['datasets'][0]

        const trafficDataset = {
          type: 'bar' as const,
          label: t('traffic'),
          backgroundColor: (context: { raw: number }) =>
            context.raw ? getColorForValue(context.raw, trafficColorMap) : 'black',
          hoverBorderColor: colors.blue[600],
          transitions: {
            duration: 1000,
            easing: 'easeInOutCubic'
          },
          data: rawData.map((item: TrafficAirData) => item.traffic_data?.traffic_quality_index ?? 0),
          yAxisID: 'y1'
        } as ChartData<'bar'>['datasets'][0]

        setChartData({
          labels,
          datasets: [airQualityDataset, trafficDataset]
        })

        setChartOptions({
          ...defaultChartOptions,
          plugins: {
            ...defaultChartOptions.plugins,
            title: {
              display: true,
              text: `${location ?? 'Ba Tháng Hai - Sư Vạn Hạnh'} ${startDate.format('DD/MM/YYYY')}${endDate.isSame(startDate, 'day') ? '' : `-${endDate.format('DD/MM/YYYY')}`}`
            }
          },
          scales: {
            y: {
              ...defaultChartOptions.scales?.y,
              suggestedMax:
                Math.max(...rawData.map((item: TrafficAirData) => item.air_data?.air_quality_index ?? 0)) * 1.3,
              title: {
                display: true,
                text: t('air_quality_index')
              }
            },
            y1: {
              ...defaultChartOptions.scales?.y1,
              suggestedMax:
                Math.max(...rawData.map((item: TrafficAirData) => item.traffic_data?.traffic_quality_index ?? 0)) * 1.3,
              title: {
                display: true,
                text: t('traffic_quality_index')
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
  }, [rawData, labels, location, startDate, endDate, t])
  return (
    <div className="h-[20rem] w-full rounded-md border border-gray-200 md:h-[36.5rem] lg:col-span-8">
      <Spin spinning={loading} tip={t('loading...')} fullscreen />
      <Chart
        ref={chartRef}
        type="bar"
        data={chartData as ChartData<'bar'>}
        options={chartOptions}
        className="h-full w-full"
      />
    </div>
  )
}

export default CombineChart
