import axios from 'axios'
import type { KPISummary } from '../types'

export const fetchKPISummary = async (startDate?: string, endDate?: string): Promise<KPISummary> => {
  const params: Record<string, string> = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  const { data } = await axios.get<KPISummary>('/api/kpi/summary', { params })
  return data
}
