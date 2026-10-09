import React from 'react'
import { NavLink } from 'react-router-dom'

const Icons = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm8-4a1 1 0 100 2 1 1 0 000-2zm0 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
    </svg>
  ),
  train: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C8.13 2 5 5.13 5 9v7l-1.71 1.71C3.1 17.9 3 18.17 3 18.5V19c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-.5c0-.33-.1-.6-.29-.79L19 16V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v7H7V9c0-2.76 2.24-5 5-5zM9 18c0 1.1.9 2 2 2s2-.9 2-2H9z"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  station: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  ),
}

const links = [
  { to: '/',         label: 'Dashboard',          icon: Icons.dashboard, end: true  },
  { to: '/trains',   label: 'Train Analysis',      icon: Icons.train,     end: false },
  { to: '/delays',   label: 'Delay Analytics',     icon: Icons.chart,     end: false },
  { to: '/stations', label: 'Station Analytics',   icon: Icons.station,   end: false },
  { to: '/schedule', label: 'Schedule vs Actuals', icon: Icons.schedule,  end: false },
]

const Sidebar: React.FC = () => (
  <aside className="shrink-0 flex flex-col" style={{ width: 240, minHeight: '100vh', background: '#0f172a' }}>
    {/* Logo */}
    <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl"
          style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path d="M12 2C8.13 2 5 5.13 5 9v7l-1.71 1.71C3.1 17.9 3 18.17 3 18.5V19c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-.5c0-.33-.1-.6-.29-.79L19 16V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v7H7V9c0-2.76 2.24-5 5-5zM9 18c0 1.1.9 2 2 2s2-.9 2-2H9z" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight tracking-tight">Indian Railways</div>
          <div className="text-xs leading-tight" style={{ color: '#94a3b8' }}>Delay Analytics</div>
        </div>
      </div>
    </div>

    <div className="px-6 pt-5 pb-2">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>Menu</span>
    </div>

    <nav className="flex-1 px-3">
      {links.map(({ to, label, icon, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all duration-150 ${isActive ? 'text-white' : 'hover:bg-white/5'}`
          }
          style={({ isActive }) =>
            isActive
              ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))', color: '#a5b4fc', borderLeft: '2px solid #6366f1', paddingLeft: 10 }
              : { color: '#94a3b8' }
          }>
          <span style={{ opacity: 0.85 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
        <span className="text-xs" style={{ color: '#64748b' }}>Live · Indian Railways</span>
      </div>
    </div>
  </aside>
)

export default Sidebar
