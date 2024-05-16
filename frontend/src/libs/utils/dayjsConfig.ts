import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime' // Example for adding more plugins
import localizedFormat from 'dayjs/plugin/localizedFormat'

// Extend dayjs with the plugins you need
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

dayjs.locale('vi')

export default dayjs
