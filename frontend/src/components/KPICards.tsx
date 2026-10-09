import React from 'react'
import type { KPISummary } from '../types'

interface Props {
  data: KPISummary | null
  loading: boolean
}

interface CardProps {
  label: string
  value: string | number
  sub: string
  color: string
  icon: React.ReactNode
}

const Card: React.FC<CardProps> = ({ label, value, sub, color, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 48, height: 48, background: color }}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</div>
      <div className="text-sm font-semibold text-gray-600 mt-0.5">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  </div>
)

const Skeleton = () => <div className="rounded-2xl skeleton" style={{ minHeight: 96 }} />

const KPICards: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
      </div>
    )
  }
  if (!data) return null

  const cards = [
    {
      label: 'Total Trains',
      value: data.total_trains,
      sub: 'Tracked in period',
      color: '#eef2ff',
      icon: <svg viewBox="0 0 24 24" fill="#6366f1" className="w-6 h-6"><path d="M12 2C8.13 2 5 5.13 5 9v7l-1.71 1.71C3.1 17.9 3 18.17 3 18.5V19c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-.5c0-.33-.1-.6-.29-.79L19 16V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v7H7V9c0-2.76 2.24-5 5-5zM9 18c0 1.1.9 2 2 2s2-.9 2-2H9z"/></svg>,
    },
    {
      label: 'On-Time Trains',
      value: data.on_time_trains,
      sub: 'Arrived within 5 min',
      color: '#ecfdf5',
      icon: <svg viewBox="0 0 20 20" fill="#10b981" className="w-6 h-6"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>,
    },
    {
      label: 'Delayed Trains',
      value: data.delayed_trains,
      sub: 'Arrived late',
      color: '#fffbeb',
      icon: <svg viewBox="0 0 20 20" fill="#f59e0b" className="w-6 h-6"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>,
    },
    {
      label: 'Cancelled Trains',
      value: data.cancelled_trains,
      sub: 'Not operated',
      color: '#fef2f2',
      icon: <svg viewBox="0 0 20 20" fill="#ef4444" className="w-6 h-6"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>,
    },
    {
      label: 'On-Time %',
      value: `${data.on_time_pct}%`,
      sub: 'Performance rate',
      color: '#f0fdf4',
      icon: <svg viewBox="0 0 20 20" fill="#22c55e" className="w-6 h-6"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
    },
    {
      label: 'Avg Delay',
      value: `${data.avg_delay_minutes} min`,
      sub: 'Mean delay for delayed trains',
      color: data.avg_delay_minutes <= 15 ? '#fffbeb' : '#fef2f2',
      icon: <svg viewBox="0 0 20 20" fill={data.avg_delay_minutes <= 15 ? '#f59e0b' : '#ef4444'} className="w-6 h-6"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>,
    },
    {
      label: 'Worst Train',
      value: data.worst_route ? data.worst_route.split(' - ')[0] : '—',
      sub: data.worst_route ? data.worst_route.split(' - ').slice(1).join(' - ') : 'No data',
      color: '#fff7ed',
      icon: <svg viewBox="0 0 20 20" fill="#f97316" className="w-6 h-6"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
    },
    {
      label: 'Total Trips',
      value: data.total_trips_today,
      sub: 'Unique trips tracked',
      color: '#f5f3ff',
      icon: <svg viewBox="0 0 20 20" fill="#8b5cf6" className="w-6 h-6"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>,
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => <Card key={i} {...c} />)}
    </div>
  )
}

export default KPICards
