import { Spin } from 'antd'
import { useAppSelector } from 'libs/redux'
import { useState } from 'react'

export const Traffic = () => {
  const locationID = useAppSelector((state) => state.data.currentLocationID)
  const [isLoading, setIsLoading] = useState(true)
  const locations = useAppSelector((state) => state.data.mapLocation)

  const urlImage = locations.find((location) => location.id === locationID)?.request

  return (
    <Spin spinning={isLoading} size="large" tip="Loading...">
      <div className="flex flex-col items-center">
        <img
          src={urlImage}
          width={400}
          height={200}
          style={{ objectFit: 'cover' }}
          className="rounded-md"
          alt="camera"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </Spin>
  )
}
