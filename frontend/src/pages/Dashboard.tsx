import React, { useEffect, useState } from 'react'
import KPICards from '../components/KPICards'
import { fetchKPISummary } from '../api/kpi'
import { fetchMonthlyTrends } from '../api/delays'
import { useFilter } from '../context/FilterContext'
import type { KPISummary, MonthlyTrend } from '../types'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const tooltipStyle = {
  backgroundColor: '#1e293b', border: 'none', borderRadius: 10,
  color: '#f1f5f9', fontSize: 12, padding: '8px 14px',
}

const Dashboard: React.FC = () => {
  const { dateRange } = useFilter()
  const [data, setData] = useState<KPISummary | null>(null)
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchKPISummary(dateRange.startDate, dateRange.endDate),
      fetchMonthlyTrends(dateRange.startDate, dateRange.endDate),
    ])
      .then(([kpi, tr]) => { setData(kpi); setTrends(tr) })
      .catch(e => setError(e?.message ?? 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [dateRange.startDate, dateRange.endDate])

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>{error} — Make sure the backend is running and seed data has been loaded.</span>
        </div>
      )}

      {/* KPI Cards */}
      <KPICards data={data} loading={loading} />

      {/* Monthly Delay Trends */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Monthly Delay Trends</div>
            <div className="text-xs text-gray-400 mt-0.5">Average delay and cancellations per month</div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          {loading ? (
            <div className="rounded-xl skeleton" style={{ height: 280 }} />
          ) : trends.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No trend data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trends} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="m" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }} />
                <Bar yAxisId="right" dataKey="cancelled" name="Cancelled" fill="#fecaca" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="total_events" name="Total Events" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="avg_delay" name="Avg Delay (min)"
                  stroke="#6366f1" strokeWidth={2.5} dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status breakdown bar */}
      {data && !loading && (
        <div className="card px-6 py-5">
          <div className="card-title mb-3">Network Status Breakdown</div>
          <div className="flex rounded-xl overflow-hidden h-8 text-xs font-semibold">
            {data.total_trains > 0 && (
              <>
                <div className="flex items-center justify-center text-white"
                  style={{ width: `${(data.on_time_trains / data.total_trains) * 100}%`, background: '#10b981', minWidth: 30 }}>
                  {data.on_time_trains}
                </div>
                <div className="flex items-center justify-center text-white"
                  style={{ width: `${(data.delayed_trains / data.total_trains) * 100}%`, background: '#f59e0b', minWidth: 30 }}>
                  {data.delayed_trains}
                </div>
                <div className="flex items-center justify-center text-white"
                  style={{ width: `${(data.cancelled_trains / data.total_trains) * 100}%`, background: '#ef4444', minWidth: 30 }}>
                  {data.cancelled_trains}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-5 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />On Time</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Delayed</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Cancelled</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
