import React, { useEffect, useState } from 'react'
import StationAnalytics from '../components/StationAnalytics'
import { fetchStationsSummary } from '../api/stations'
import { useFilter } from '../context/FilterContext'
import type { StationSummary } from '../types'

const Stations: React.FC = () => {
  const { dateRange } = useFilter()
  const [stations, setStations] = useState<StationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchStationsSummary(dateRange.startDate, dateRange.endDate)
      .then(setStations)
      .catch(e => setError(e?.message ?? 'Failed to load station data'))
      .finally(() => setLoading(false))
  }, [dateRange.startDate, dateRange.endDate])

  return (
    <div className="space-y-5">
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
        >
          {error}
        </div>
      )}
      <StationAnalytics stations={stations} loading={loading} />
    </div>
  )
}

export default Stations
