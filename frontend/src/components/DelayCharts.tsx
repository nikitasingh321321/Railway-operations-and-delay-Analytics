import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { DelayBucket, DelayByHour, DelayCause } from '../types'

interface Props {
  distribution: DelayBucket[]
  byHour: DelayByHour[]
  causes: DelayCause[]
  loading: boolean
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#64748b']

const BUCKET_COLORS: Record<string, string> = {
  '0-5 min':   '#10b981',
  '5-15 min':  '#f59e0b',
  '15-30 min': '#f97316',
  '30-60 min': '#ef4444',
  '60+ min':   '#7f1d1d',
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

const ChartCard: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <div className="card">
    <div className="card-header">
      <div>
        <div className="card-title">{title}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
    <div className="px-4 pb-4 pt-3">{children}</div>
  </div>
)

const DelayCharts: React.FC<Props> = ({ distribution, byHour, causes, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl skeleton" style={{ height: 300 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Delay Distribution */}
      <ChartCard title="Delay Distribution" sub="Number of trains per delay bucket">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={distribution} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="count" name="Trains" radius={[6, 6, 0, 0]}>
              {distribution.map((entry) => (
                <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Delay by Hour */}
      <ChartCard title="Avg Delay by Hour" sub="Mean delay across hours of the day">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={byHour} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={h => `${h}h`} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="m" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} min`, 'Avg Delay']}
              labelFormatter={h => `${h}:00`}
            />
            <Line
              type="monotone"
              dataKey="avg_delay"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Delay Causes */}
      <ChartCard title="Delay Causes" sub="Breakdown by root cause category">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={causes}
              dataKey="count"
              nameKey="cause"
              cx="50%"
              cy="46%"
              outerRadius={82}
              innerRadius={48}
              paddingAngle={3}
              strokeWidth={0}
            >
              {causes.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [v, name]} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

export default DelayCharts
