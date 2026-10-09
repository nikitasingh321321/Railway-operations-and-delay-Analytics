import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { RouteItem, TripItem, ScheduleStop } from '../types'
import { fetchRoutes, fetchTripsForRoute, fetchTripSchedule } from '../api/schedule'

const toMinutes = (t: string | null): number | null => {
  if (!t) return null
  const parts = t.split(':').map(Number)
  if (parts.length < 2) return null
  return parts[0] * 60 + parts[1] + (parts[2] ?? 0) / 60
}

const delayColor = (d: number | null) => {
  if (d === null) return '#9ca3af'
  if (d <= 5)  return '#10b981'
  if (d <= 15) return '#f59e0b'
  return '#ef4444'
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  padding: '8px 14px',
}

const ScheduleGantt: React.FC = () => {
  const [routes, setRoutes]           = useState<RouteItem[]>([])
  const [trips, setTrips]             = useState<TripItem[]>([])
  const [stops, setStops]             = useState<ScheduleStop[]>([])
  const [selectedRoute, setSelectedRoute] = useState('')
  const [selectedTrip, setSelectedTrip]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [routesLoading, setRoutesLoading] = useState(true)

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch(() => setRoutes([]))
      .finally(() => setRoutesLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedRoute) { setTrips([]); setStops([]); setSelectedTrip(''); return }
    fetchTripsForRoute(selectedRoute).then(setTrips).catch(() => setTrips([]))
    setStops([])
    setSelectedTrip('')
  }, [selectedRoute])

  useEffect(() => {
    if (!selectedTrip) { setStops([]); return }
    setLoading(true)
    fetchTripSchedule(selectedTrip).then(setStops).catch(() => setStops([])).finally(() => setLoading(false))
  }, [selectedTrip])

  const chartData = stops.map(s => {
    const sched = toMinutes(s.scheduled_arrival)
    const delay = s.delay_minutes ?? 0
    return {
      name: s.stop_name.length > 22 ? s.stop_name.substring(0, 20) + '…' : s.stop_name,
      scheduled: sched ?? 0,
      delay: delay > 0 ? delay : 0,
      delayColor: delayColor(s.delay_minutes),
      scheduledLabel: s.scheduled_arrival ?? '—',
      actualLabel: s.actual_arrival ?? '—',
      delayLabel: s.delay_minutes !== null ? `${s.delay_minutes} min` : '—',
    }
  })

  return (
    <div className="space-y-5">
      {/* Selectors */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</label>
            <select
              value={selectedRoute}
              onChange={e => setSelectedRoute(e.target.value)}
              className="select-field min-w-[200px]"
              disabled={routesLoading}
            >
              <option value="">{routesLoading ? 'Loading routes…' : 'Select a route'}</option>
              {routes.map(r => (
                <option key={r.route_id} value={r.route_id}>
                  {r.route_short_name || r.route_id} — {r.route_long_name || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trip</label>
            <select
              value={selectedTrip}
              onChange={e => setSelectedTrip(e.target.value)}
              className="select-field min-w-[220px]"
              disabled={!selectedRoute || trips.length === 0}
            >
              <option value="">
                {!selectedRoute ? 'Select a route first' : trips.length === 0 ? 'No trips available' : 'Select a trip'}
              </option>
              {trips.map(t => (
                <option key={t.trip_id} value={t.trip_id}>
                  {t.trip_headsign || t.trip_id}{t.direction_id !== null ? ` (Dir ${t.direction_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Legend inline */}
          {stops.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-500 ml-auto">
              {[
                { color: '#d1d5db', label: 'Scheduled' },
                { color: '#10b981', label: '≤5 min' },
                { color: '#f59e0b', label: '5–15 min' },
                { color: '#ef4444', label: '>15 min' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="rounded-2xl skeleton" style={{ height: 380 }} />
      ) : stops.length === 0 ? (
        <div
          className="card flex flex-col items-center justify-center gap-3"
          style={{ height: 280 }}
        >
          <svg viewBox="0 0 24 24" fill="#d1d5db" className="w-12 h-12">
            <path d="M12 2C8.13 2 5 5.13 5 9v7l-1.71 1.71C3.1 17.9 3 18.17 3 18.5V19c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-.5c0-.33-.1-.6-.29-.79L19 16V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v7H7V9c0-2.76 2.24-5 5-5zM9 18c0 1.1.9 2 2 2s2-.9 2-2H9z"/>
          </svg>
          <p className="text-gray-400 text-sm">Select a route and trip to view the Gantt timeline</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Schedule vs Actuals — Stop Timeline</div>
              <div className="text-xs text-gray-400 mt-0.5">{stops.length} stops · bars show scheduled time + delay extension</div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-3">
            <ResponsiveContainer width="100%" height={Math.max(320, stops.length * 40)}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 4, right: 50, left: 110, bottom: 4 }}
                barSize={11}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  width={105}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string, props) => {
                    if (name === 'scheduled') return [props.payload.scheduledLabel, 'Scheduled']
                    return [props.payload.delayLabel, 'Delay']
                  }}
                />
                <Bar dataKey="scheduled" name="Scheduled" fill="#e2e8f0" radius={[0, 5, 5, 0]} />
                <Bar dataKey="delay" name="Delay" radius={[0, 5, 5, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.delayColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleGantt
