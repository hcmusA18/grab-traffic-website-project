import { Pagination, Col, Row } from 'antd'
import { lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from 'react-responsive'
import { LocationService } from 'services/LocationService'
const CustomImage = lazy(() => import('components/CustomImage'))

interface LocationListProps {
  locationId: string
  onChangeLocation: (locationId: string) => void
}

export const LocationList = ({ locationId, onChangeLocation }: LocationListProps) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' })
  const isTablet = useMediaQuery({ query: '(max-width: 1024px)' })
  const [itemsPerPage, setItemsPerPage] = useState<number>(4)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const locationService = LocationService.getInstance()
  const [data, setData] = useState<MapLocation[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    const fetchData = async () => {
      const data = await locationService.getNearbyLocations({ id: locationId, radius: '12', number: '12' })
      setData(data.splice(1, 10))
    }
    fetchData()
  }, [locationId, locationService])
  useEffect(() => {
    if (isMobile) {
      setItemsPerPage(1)
    } else if (isTablet) {
      setItemsPerPage(2)
    } else {
      setItemsPerPage(4)
    }
  }, [isMobile, isTablet])

  return (
    <div className="col-span-full flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-sm font-bold uppercase md:text-lg ">{t('related_locations')}</h2>
        <Pagination
          responsive={true}
          defaultCurrent={1}
          current={currentPage}
          onChange={(page) => setCurrentPage(page)}
          total={data.length}
          pageSize={itemsPerPage}
          simple={isMobile}
          showSizeChanger={false}
        />
      </div>
      <Row gutter={16} className="mx-auto mt-4 w-full">
        {data &&
          data.length > 0 &&
          data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, _) => (
            <Col span={24 / itemsPerPage} key={item.id}>
              <div
                className="mx-auto flex flex-col items-center justify-between rounded-md border border-slate-200 bg-white"
                role="button"
                onClick={() => {
                  if (item.id.toString() !== locationId) {
                    onChangeLocation(item.id.toString())
                  }
                }}>
                <CustomImage
                  src={API_URL + `/image/locationID=${item.id}`}
                  alt="camera"
                  className=" w-full rounded-t-md object-cover"
                  containerClassName="w-full h-52 flex items-center justify-center"
                />
                <div className="p-4">
                  <h3 className="leading-2 line-clamp-1 text-lg font-bold">{item.place}</h3>
                  {/* <p className="leading-1 line-clamp-1 text-sm text-gray-500">{item.description}</p> */}
                </div>
              </div>
            </Col>
          ))}
      </Row>
    </div>
  )
}

export default LocationList
