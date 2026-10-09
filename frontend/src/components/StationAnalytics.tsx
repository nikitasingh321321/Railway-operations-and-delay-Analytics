import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import type { StationSummary, StationDailyDelay } from '../types'
import { fetchStationDetail } from '../api/stations'

interface Props {
  stations: StationSummary[]
  loading: boolean
}

type SortKey = 'avg_delay' | 'on_time_pct' | 'total_events' | 'stop_name'

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  padding: '8px 14px',
}

const delayBadge = (d: number) => {
  if (d <= 5)  return <span className="badge-green">{d} min</span>
  if (d <= 15) return <span className="badge-yellow">{d} min</span>
  return <span className="badge-red">{d} min</span>
}

const onTimeBadge = (p: number) => {
  if (p >= 80) return <span className="badge-green">{p}%</span>
  if (p >= 60) return <span className="badge-yellow">{p}%</span>
  return <span className="badge-red">{p}%</span>
}

const SortIcon: React.FC<{ active: boolean; asc: boolean }> = ({ active, asc }) => (
  <span className="ml-1 inline-flex flex-col gap-0" style={{ opacity: active ? 1 : 0.3 }}>
    <svg viewBox="0 0 6 4" className="w-2 h-1.5" fill={active && asc ? '#6366f1' : '#94a3b8'}><path d="M3 0L6 4H0z"/></svg>
    <svg viewBox="0 0 6 4" className="w-2 h-1.5" fill={active && !asc ? '#6366f1' : '#94a3b8'}><path d="M3 4L0 0h6z"/></svg>
  </span>
)

const StationAnalytics: React.FC<Props> = ({ stations, loading }) => {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('avg_delay')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<StationSummary | null>(null)
  const [detail, setDetail] = useState<StationDailyDelay[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const handleSelect = async (station: StationSummary) => {
    setSelected(station)
    setDetailLoading(true)
    try {
      const data = await fetchStationDetail(station.stop_id)
      setDetail(data)
    } catch {
      setDetail([])
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = stations
    .filter(s => s.stop_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av < bv) return sortAsc ? -1 : 1
      if (av > bv) return sortAsc ? 1 : -1
      return 0
    })

  if (loading) {
    return <div className="rounded-2xl skeleton" style={{ height: 320 }} />
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-sm">
        <svg viewBox="0 0 20 20" fill="#94a3b8" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
        </svg>
        <input
          type="text"
          placeholder="Search stations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-full pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {([
                  { key: 'stop_name',    label: 'Station' },
                  { key: 'avg_delay',    label: 'Avg Delay' },
                  { key: 'on_time_pct',  label: 'On-Time %' },
                  { key: null,           label: 'Worst Day' },
                  { key: 'total_events', label: 'Events' },
                ] as Array<{ key: SortKey | null; label: string }>).map(({ key, label }) => (
                  <th
                    key={label}
                    onClick={key ? () => handleSort(key) : undefined}
                    className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide select-none ${key ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                  >
                    {label}
                    {key && <SortIcon active={sortKey === key} asc={sortAsc} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No stations match your search
                  </td>
                </tr>
              )}
              {filtered.map((s, idx) => (
                <tr
                  key={s.stop_id}
                  onClick={() => handleSelect(s)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: selected?.stop_id === s.stop_id ? '#f5f3ff' : 'white',
                  }}
                  onMouseEnter={e => { if (selected?.stop_id !== s.stop_id) (e.currentTarget as HTMLElement).style.background = '#fafafa' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected?.stop_id === s.stop_id ? '#f5f3ff' : 'white' }}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {selected?.stop_id === s.stop_id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                      )}
                      {s.stop_name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{delayBadge(s.avg_delay)}</td>
                  <td className="px-5 py-3.5">{onTimeBadge(s.on_time_pct)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{s.worst_day ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500">{s.total_events.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Chart */}
      {selected && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{selected.stop_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">Daily average delay — last 30 days</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xs"
            >
              ✕ Close
            </button>
          </div>
          <div className="px-4 pb-4 pt-3">
            {detailLoading ? (
              <div className="rounded-xl skeleton" style={{ height: 200 }} />
            ) : detail.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">No detail data for this station</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={detail} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="m" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} min`, 'Avg Delay']} />
                  <Area type="monotone" dataKey="avg_delay" stroke="#6366f1" strokeWidth={2.5} fill="url(#stationGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StationAnalytics
