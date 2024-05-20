export const getColorForValue = (value: number, colorRanges: { range: [number, number]; color: string }[]): string => {
  const matchingColor = colorRanges.find(({ range }) => Math.round(value) >= range[0] && value <= range[1])
  return matchingColor ? matchingColor.color : 'gray'
}

// make the color darker or lighter by a given portion
// negative values will make the color darker
// positive values will make the color lighter
export const translateColor = (color: string, portion: number): string => {
  if (color.startsWith('#')) {
    color = color.slice(1)
  }

  const newR = Math.floor(parseInt(color.slice(0, 2), 16) * (1 + portion))
  const newG = Math.floor(parseInt(color.slice(2, 4), 16) * (1 + portion))
  const newB = Math.floor(parseInt(color.slice(4, 6), 16) * (1 + portion))

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}
