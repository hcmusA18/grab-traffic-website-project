/* eslint-disable no-console */
import { useEffect, useState } from 'react'
import { RankingService } from 'services'

export const TestPage = () => {
  const [error, setError] = useState<string>('')
  const enviroService = RankingService.getInstance()

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await enviroService.getCurrentRanking({ option: 'both' })
        console.log(data)
      } catch (error: unknown) {
        console.log(error)
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('Error fetching locations')
        }
      }
    }

    fetchLocations()
  }, [enviroService])

  if (error) {
    return <div>Error: {error}</div>
  }

  return <div>Test</div>
}

export default TestPage
