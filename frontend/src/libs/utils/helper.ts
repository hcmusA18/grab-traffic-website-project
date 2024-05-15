export const getColorForValue = (value: number, colorRanges: { range: [number, number]; color: string }[]): string => {
  const matchingColor = colorRanges.find(({ range }) => value >= range[0] && value <= range[1])
  return matchingColor ? matchingColor.color : 'gray'
}
