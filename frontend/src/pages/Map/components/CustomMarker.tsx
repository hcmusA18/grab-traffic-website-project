import { airColorMap } from 'libs/utils/constant'
import { getColorForValue } from 'libs/utils/helper'
import { Marker } from 'react-map-gl'

interface CustomMarkerProps {
  locationID: string
  lng: number
  lat: number
  onClick: (locationID: string, lng: number, lat: number) => void
  air_quality: number
  air_quality_index: number
}

export const CustomMarker: React.FC<CustomMarkerProps> = ({
  locationID,
  lng,
  lat,
  onClick,
  air_quality_index
}: CustomMarkerProps) => {
  const animationDelay = (parseInt(locationID) % 20) * Math.random()
  return (
    <Marker
      latitude={lat ?? 10.770496918}
      longitude={lng ?? 106.692330564}
      anchor="bottom"
      onClick={(e) => {
        if (e) {
          e.originalEvent.stopPropagation()
        }
        onClick(locationID, lng, lat)
      }}>
      <div
        className="disappearing-appearing-div flex flex-col items-center justify-center"
        style={{ animationDelay: `${animationDelay}s` }}>
        <div
          className={`flex h-8 w-8 translate-y-5 items-center justify-center rounded-full border border-white border-opacity-45 bg-opacity-80`}
          style={{
            backgroundColor: getColorForValue(air_quality_index, airColorMap)
          }}>
          <h3 className="text-center text-white">{air_quality_index}</h3>
        </div>
        <div
          className={`h-8 w-1 translate-y-5 bg-opacity-80`}
          style={{ backgroundColor: getColorForValue(air_quality_index, airColorMap) }}
        />
        <div className="pulsing-dot" style={{ backgroundColor: getColorForValue(air_quality_index, airColorMap) }} />
      </div>
    </Marker>
  )
}

export default CustomMarker
