import React from 'react'
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
import { Line } from 'react-chartjs-2'
import { getColorForValue } from 'libs/utils/helper'

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

export const ChangeBoard: React.FC<RankingBoardProps> = ({ ranking, options }: RankingBoardProps) => {
  const { title, columns, color } = options
  const chartOptions: ChartOptions<'line'> = {
    indexAxis: 'y' as const,
    elements: {
      bar: {
        borderWidth: 2
      }
    },
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(...ranking.map((rank) => Number(rank[options.columns[1].key]))) * 1.3
      }
    },
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const label = context.dataset.label ?? ''
            if (context.parsed.y !== null) {
              label.concat(`: ${context.parsed.y}`)
            }
            return label
          }
        }
      },
      datalabels: {
        align: 'start',
        anchor: 'end',
        offset: 4,
        color: '#f9f9f9',
        font: {
          weight: 'bold'
        },
        formatter: (value: number) => {
          return value
        }
      }
    }
  }

  const generateChartData = (): ChartData<'line'> => {
    const labels = ranking.map((rank) => rank[columns[0].key])
    const data = ranking.map((rank) => rank[columns[1].key])

    const sortedData = data.sort((a, b) => Number(b) - Number(a))

    const datasets: ChartData<'line'>['datasets'] = [
      {
        label: columns[1].title,
        data: sortedData.map((value: string | number) => Number(value)),
        backgroundColor: sortedData.map((value: number | string) => getColorForValue(value as number, color)),
        borderColor: sortedData.map((value: number | string) => getColorForValue(value as number, color)),
        borderWidth: 1
      }
    ]

    // only show top 10
    if (ranking.length > 10) {
      labels.splice(10)
      datasets.splice(10)
    }

    return {
      labels,
      datasets
    }
  }

  return (
    <div>
      <h2 className="text-center text-2xl font-bold uppercase">{title}</h2>
      <Line data={generateChartData()} options={chartOptions} plugins={[ChartDataLabels]} />
    </div>
  )
}
