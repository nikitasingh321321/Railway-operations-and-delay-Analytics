import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useFilter } from '../context/FilterContext'

const pageTitles: Record<string, { title: string; sub: string }> = {
  '/':         { title: 'Dashboard',           sub: 'Indian Railways — Network-wide performance overview' },
  '/trains':   { title: 'Train Analysis',      sub: 'Per-train delay, on-time and cancellation statistics' },
  '/delays':   { title: 'Delay Analytics',     sub: 'Distribution, hourly patterns, monthly trends and root causes' },
  '/stations': { title: 'Station Analytics',   sub: 'Per-station delay statistics and 30-day trends' },
  '/schedule': { title: 'Schedule vs Actuals', sub: 'Compare timetable arrivals against actual times' },
}

const Layout: React.FC = () => {
  const { dateRange, setDateRange } = useFilter()
  const location = useLocation()
  const page = pageTitles[location.pathname] ?? pageTitles['/']

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-8 py-0 shrink-0"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e8eaed',
            height: 60,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Page title */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-gray-900 leading-tight" style={{ fontSize: 15 }}>
                {page.title}
              </h1>
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{page.sub}</p>
            </div>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{ background: '#f8f9fb', border: '1px solid #e8eaed' }}
            >
              <svg viewBox="0 0 16 16" fill="#6b7280" className="w-3.5 h-3.5 shrink-0">
                <path d="M5 .5a.5.5 0 01.5.5v.5h5V1a.5.5 0 011 0v.5h1A1.5 1.5 0 0114 3v10a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 13V3a1.5 1.5 0 011.5-1.5H5V1A.5.5 0 015 .5zM3 5v8a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V5H3z"/>
              </svg>
              <span className="text-xs text-gray-500 font-medium">From</span>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
                style={{ border: 'none', padding: 0 }}
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
                style={{ border: 'none', padding: 0 }}
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
