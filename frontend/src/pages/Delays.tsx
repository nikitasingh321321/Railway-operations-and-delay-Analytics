import React, { useEffect, useState } from 'react'
import DelayCharts from '../components/DelayCharts'
import { fetchDelayDistribution, fetchDelayByHour, fetchDelayCauses, fetchMonthlyTrends } from '../api/delays'
import { useFilter } from '../context/FilterContext'
import type { DelayBucket, DelayByHour, DelayCause, MonthlyTrend } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const tooltipStyle = {
  backgroundColor: '#1e293b', border: 'none', borderRadius: 10,
  color: '#f1f5f9', fontSize: 12, padding: '8px 14px',
}

const Delays: React.FC = () => {
  const { dateRange } = useFilter()
  const [distribution, setDistribution] = useState<DelayBucket[]>([])
  const [byHour, setByHour] = useState<DelayByHour[]>([])
  const [causes, setCauses] = useState<DelayCause[]>([])
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchDelayDistribution(dateRange.startDate, dateRange.endDate),
      fetchDelayByHour(dateRange.startDate, dateRange.endDate),
      fetchDelayCauses(dateRange.startDate, dateRange.endDate),
      fetchMonthlyTrends(dateRange.startDate, dateRange.endDate),
    ])
      .then(([dist, hours, caus, tr]) => {
        setDistribution(dist); setByHour(hours); setCauses(caus); setTrends(tr)
      })
      .catch(e => setError(e?.message ?? 'Failed to load delay data'))
      .finally(() => setLoading(false))
  }, [dateRange.startDate, dateRange.endDate])

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Distribution, By-Hour, Causes charts */}
      <DelayCharts distribution={distribution} byHour={byHour} causes={causes} loading={loading} />

      {/* Monthly Trends */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Monthly Delay Trends</div>
            <div className="text-xs text-gray-400 mt-0.5">Total events and cancellations per month</div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          {loading ? (
            <div className="rounded-xl skeleton" style={{ height: 260 }} />
          ) : trends.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trends} margin={{ top: 4, right: 16, left: -10, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }} />
                <Bar dataKey="total_events" name="Total Events" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#fca5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Delay Reasons Summary */}
      {!loading && causes.length > 0 && (
        <div className="card px-6 py-5">
          <div className="card-title mb-4">Delay Reasons Breakdown</div>
          <div className="space-y-3">
            {causes.map((c, i) => {
              const max = causes[0]?.count || 1
              const pct = Math.round((c.count / max) * 100)
              const colors = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#64748b']
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-gray-600 font-medium shrink-0">{c.cause}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                  </div>
                  <div className="w-10 text-right text-xs text-gray-500">{c.count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Delays
