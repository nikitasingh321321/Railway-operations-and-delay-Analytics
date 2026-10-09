import axios from 'axios'
import type { StationSummary, StationDailyDelay } from '../types'

export const fetchStationsSummary = (start?: string, end?: string) => {
  const params: Record<string, string> = {}
  if (start) params.start_date = start
  if (end) params.end_date = end
  return axios.get<StationSummary[]>('/api/stations/summary', { params }).then(r => r.data)
}

export const fetchStationDetail = (stopId: string) =>
  axios.get<StationDailyDelay[]>(`/api/stations/${encodeURIComponent(stopId)}/detail`).then(r => r.data)
