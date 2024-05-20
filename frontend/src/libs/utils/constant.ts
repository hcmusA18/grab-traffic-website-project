import colors from 'tailwindcss/colors'

export const airQualityConfig = {
  good: { min: 0, max: 50.99, color: colors.green[500] },
  moderate: { min: 51, max: 100.99, color: colors.yellow[500] },
  unhealthy: { min: 101, max: 200.99, color: colors.orange[500] },
  very_unhealthy: { min: 201, max: 300.99, color: colors.red[500] },
  hazardous: { min: 300, max: 9999, color: colors.purple[500] }
}

export const airColorMap = [
  { range: [0, 50.99] as [number, number], color: colors.green[500] },
  { range: [51, 100.99] as [number, number], color: colors.yellow[500] },
  { range: [101, 200.99] as [number, number], color: colors.orange[500] },
  { range: [201, 300.99] as [number, number], color: colors.red[500] },
  { range: [301, 9999] as [number, number], color: colors.purple[500] }
]
