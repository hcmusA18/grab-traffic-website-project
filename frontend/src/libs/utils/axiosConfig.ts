// Axios Instance Configuration skeleton
import axios from 'axios'

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL
})
