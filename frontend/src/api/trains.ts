import axios from 'axios'
import type { TrainSummary } from '../types'

export const fetchTrainsSummary = (start?: string, end?: string, search?: string) => {
  const params: Record<string, string> = {}
  if (start) params.start_date = start
  if (end) params.end_date = end
  if (search) params.search = search
  return axios.get<TrainSummary[]>('/api/trains/summary', { params }).then(r => r.data)
}
