import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem,
  ChartOptions
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'
import { getColorForValue } from 'libs/utils/helper'
import colors from 'tailwindcss/colors'
import { useAppSelector } from 'libs/redux'

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, BarElement, LineElement)

/**
 * Props for the RankingBoard component.
 *
 * @param ranking - The ranking to display.
 * @param options - The options for the ranking board.
 * @param options.title - The title of the ranking board.
 * @param options.columns - The columns to display in the ranking board.
 * @param options.columns.title - The title of the column.
 * @param options.columns.key - The key of the column in the ranking object.
 * @param options.color - The color range for the ranking board.
 * @param options.color.range - The range of the color.
 * @param options.color.color - The color of the ranking board.
 */
interface RankingBoardProps {
  ranking: Ranking[]
  options: {
    title: string
    columns: {
      title: string
      key: keyof Ranking
    }[]
    color: {
      range: [number, number]
      color: string
    }[]
  }
}

export const RankingBoard: React.FC<RankingBoardProps> = ({ ranking, options }: RankingBoardProps) => {
  const { title, columns, color } = options
  const numberShow = useAppSelector((state) => state.data.numberShow)
  const rankDecrease = useAppSelector((state) => state.data.rankDecrease)

  const [sortedRanking, setSortedRanking] = useState(ranking)

  useEffect(() => {
    setSortedRanking(
      [...ranking].sort((a, b) =>
        rankDecrease
          ? Number(b[columns[1].key]) - Number(a[columns[1].key])
          : Number(a[columns[1].key]) - Number(b[columns[1].key])
      )
    )
  }, [ranking, rankDecrease, columns])
  const hasNegative = sortedRanking.some((rank) => Number(rank[columns[1].key]) < 0)
  const maxValue = Math.max(...sortedRanking.map((rank) => Math.abs(Number(rank[columns[1].key]))))

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    elements: {
      bar: {
        borderWidth: 2
      }
    },
    responsive: true,
    scales: {
      x: {
        suggestedMax: maxValue * 1.1,
        min: hasNegative ? -maxValue * 1.1 : 0,
        ticks: {
          stepSize: Math.round(maxValue / 5)
        }
      }
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      title: {
        display: true,
        text: title
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            let label = context.dataset.label ?? ''
            let unit = ''
            if (label === 'PM2.5') {
              unit = 'µg/m³'
            } else if (label.toLowerCase().includes('traffic')) {
              unit = 'vehicles/hour'
            } else if (label.toLowerCase().includes('change')) {
              label = 'Change Percent'
              unit = '%'
            }
            if (context.raw) {
              return `${label}: ${context.raw}${unit}`
            }
            return label
          }
        }
      },
      datalabels: {
        align: 'start',
        anchor: 'end',
        offset: 4,
        color: colors.gray[700],
        font: {
          weight: 'bold'
        },
        formatter: (value: number) => {
          return value
        }
      }
    }
  }
  const generateChartData = (): ChartData<'bar'> => {
    const labels = sortedRanking.map((rank) => rank[columns[0].key])
    const data = sortedRanking.map((rank) => rank[columns[1].key])

    const datasets: ChartData<'bar'>['datasets'] = [
      {
        label: columns[1].title,
        data: data.map((value: string | number) => Number(value)),
        backgroundColor: data.map((value: number | string) => getColorForValue(value as number, color)),
        borderColor: data.map((value: number | string) => getColorForValue(value as number, color)),
        borderWidth: 1
      }
    ]

    if (sortedRanking.length > numberShow) {
      labels.splice(numberShow)
      datasets.splice(numberShow)
    }

    return {
      labels,
      datasets
    }
  }

  return (
    <div className="h-[20rem] md:h-[42rem]">
      <Bar data={generateChartData()} options={chartOptions} plugins={[ChartDataLabels]} />
    </div>
  )
}
