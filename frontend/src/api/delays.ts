import axios from 'axios'
import type { DelayBucket, DelayByHour, DelayCause, MonthlyTrend } from '../types'

const params = (start?: string, end?: string) => {
  const p: Record<string, string> = {}
  if (start) p.start_date = start
  if (end) p.end_date = end
  return p
}

export const fetchDelayDistribution = (start?: string, end?: string) =>
  axios.get<DelayBucket[]>('/api/delays/distribution', { params: params(start, end) }).then(r => r.data)

export const fetchDelayByHour = (start?: string, end?: string) =>
  axios.get<DelayByHour[]>('/api/delays/by-hour', { params: params(start, end) }).then(r => r.data)

export const fetchDelayCauses = (start?: string, end?: string) =>
  axios.get<DelayCause[]>('/api/delays/causes', { params: params(start, end) }).then(r => r.data)

export const fetchMonthlyTrends = (start?: string, end?: string) =>
  axios.get<MonthlyTrend[]>('/api/delays/monthly-trends', { params: params(start, end) }).then(r => r.data)
