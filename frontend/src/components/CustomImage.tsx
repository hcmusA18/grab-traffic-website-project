import { Skeleton } from 'antd'
import { FC, useEffect, useState } from 'react'

interface CustomImageProps {
  src: string
  alt: string
  containerClassName?: string
  className?: string
  onLoad?: () => void
}

export const CustomImage: FC<CustomImageProps> = ({ src, alt, containerClassName, className }: CustomImageProps) => {
  const [isImageLoading, setIsImageLoading] = useState(true)

  useEffect(() => {
    setIsImageLoading(true)
  }, [src])

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  return (
    <div className={containerClassName ?? ''}>
      {isImageLoading && <Skeleton.Image active />}
      <img
        src={src}
        style={{ objectFit: 'cover' }}
        className={`${className ?? ''} ${isImageLoading ? 'hidden' : ''}`}
        alt={alt}
        onLoad={handleImageLoad}
      />
    </div>
  )
}
