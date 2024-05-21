interface ItemProps {
  leadingIcon?: React.ReactNode
  title: string
  value: string
  unit?: string
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export const PaneItem: React.FC<ItemProps> = ({
  leadingIcon,
  title,
  value,
  unit,
  onMouseEnter,
  onMouseLeave
}: ItemProps) => (
  <div
    className="flex flex-row items-center justify-between p-2"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}>
    <div className="flex flex-row items-center gap-2">
      {leadingIcon}
      <p className="text-sm lg:font-semibold xl:text-base">{title}</p>
    </div>
    <p className="text-sm xl:text-base">
      <span className="text-sm font-semibold">{value}</span> <span>{unit}</span>
    </p>
  </div>
)

export default PaneItem
