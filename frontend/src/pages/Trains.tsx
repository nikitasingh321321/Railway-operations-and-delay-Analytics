import React, { useEffect, useState } from 'react'
import { fetchTrainsSummary } from '../api/trains'
import { useFilter } from '../context/FilterContext'
import type { TrainSummary } from '../types'

type SortKey = 'avg_delay' | 'on_time_pct' | 'total_events' | 'train_number' | 'delayed' | 'cancelled'

const badge = (label: string, color: string, bg: string) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: bg, color }}>{label}</span>
)

const SortIcon: React.FC<{ active: boolean; asc: boolean }> = ({ active, asc }) => (
  <span className="ml-1 inline-flex flex-col gap-0" style={{ opacity: active ? 1 : 0.3 }}>
    <svg viewBox="0 0 6 4" className="w-2 h-1.5" fill={active && asc ? '#6366f1' : '#94a3b8'}><path d="M3 0L6 4H0z"/></svg>
    <svg viewBox="0 0 6 4" className="w-2 h-1.5" fill={active && !asc ? '#6366f1' : '#94a3b8'}><path d="M3 4L0 0h6z"/></svg>
  </span>
)

const Trains: React.FC = () => {
  const { dateRange } = useFilter()
  const [trains, setTrains] = useState<TrainSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('avg_delay')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchTrainsSummary(dateRange.startDate, dateRange.endDate)
      .then(setTrains)
      .catch(e => setError(e?.message ?? 'Failed to load train data'))
      .finally(() => setLoading(false))
  }, [dateRange.startDate, dateRange.endDate])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = trains
    .filter(t =>
      t.train_number.toLowerCase().includes(search.toLowerCase()) ||
      t.train_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      if (av < bv) return sortAsc ? -1 : 1
      if (av > bv) return sortAsc ? 1 : -1
      return 0
    })

  const cols: Array<{ key: SortKey | null; label: string }> = [
    { key: 'train_number', label: 'Train' },
    { key: 'total_events', label: 'Total Events' },
    { key: null,           label: 'On Time' },
    { key: 'delayed',      label: 'Delayed' },
    { key: 'cancelled',    label: 'Cancelled' },
    { key: 'avg_delay',    label: 'Avg Delay' },
    { key: 'on_time_pct',  label: 'On-Time %' },
    { key: null,           label: 'Worst Station' },
  ]

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <svg viewBox="0 0 20 20" fill="#94a3b8" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Search by train number or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-9"
          />
        </div>
        <div className="text-sm text-gray-400">{filtered.length} train{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Summary mini-cards */}
      {!loading && trains.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Trains', value: trains.length, color: '#eef2ff', text: '#6366f1' },
            { label: 'Avg On-Time %', value: `${Math.round(trains.reduce((a, t) => a + t.on_time_pct, 0) / trains.length)}%`, color: '#ecfdf5', text: '#10b981' },
            { label: 'Most Delayed', value: trains[0]?.train_number ?? '—', color: '#fffbeb', text: '#f59e0b' },
            { label: 'Avg Delay', value: `${Math.round(trains.reduce((a, t) => a + t.avg_delay, 0) / trains.length)} min`, color: '#fef2f2', text: '#ef4444' },
          ].map((c, i) => (
            <div key={i} className="rounded-xl px-4 py-3" style={{ background: c.color }}>
              <div className="text-lg font-bold" style={{ color: c.text }}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="skeleton rounded-xl m-4" style={{ height: 320 }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <tr>
                  {cols.map(({ key, label }) => (
                    <th key={label}
                      onClick={key ? () => handleSort(key) : undefined}
                      className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide select-none ${key ? 'cursor-pointer hover:text-indigo-600' : ''}`}>
                      {label}
                      {key && <SortIcon active={sortKey === key} asc={sortAsc} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No trains found</td></tr>
                ) : filtered.map((t, idx) => (
                  <tr key={t.route_id}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: 'white' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{t.train_number}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{t.train_name}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{t.total_events.toLocaleString()}</td>
                    <td className="px-5 py-3.5">{badge(String(t.on_time), '#065f46', '#d1fae5')}</td>
                    <td className="px-5 py-3.5">{badge(String(t.delayed), '#92400e', '#fef3c7')}</td>
                    <td className="px-5 py-3.5">{badge(String(t.cancelled), '#991b1b', '#fee2e2')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${t.avg_delay <= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                        {t.avg_delay} min
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${t.on_time_pct >= 70 ? 'text-emerald-600' : t.on_time_pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {t.on_time_pct}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{t.worst_station ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Trains
