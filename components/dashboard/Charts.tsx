'use client'

import { ReactNode } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartContainerProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  loading?: boolean
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse h-64 flex items-end justify-around p-4 gap-2">
      {[40, 65, 50, 80, 60, 75, 45].map((h, i) => (
        <div key={i} className="w-8 bg-[var(--border)] rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export function ChartContainer({ title, subtitle, action, children, loading }: ChartContainerProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-0">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">
        {loading ? <ChartSkeleton /> : children}
      </div>
    </div>
  )
}

interface LineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: {
    key: string
    color: string
    name?: string
  }[]
  height?: number
  loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--text-muted)]">{entry.name}:</span>
            <span className="font-semibold text-[var(--text-primary)]">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function LineChart({ data, xKey, lines, height = 300, loading }: LineChartProps) {
  if (loading) return <ChartSkeleton />

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke="var(--text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          stroke="var(--text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{ paddingBottom: 20 }}
          formatter={(value) => <span className="text-sm text-[var(--text-secondary)]">{value}</span>}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name || line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  bars: {
    key: string
    color: string
    name?: string
  }[]
  height?: number
  loading?: boolean
  stacked?: boolean
}

export function BarChart({ data, xKey, bars, height = 300, loading, stacked }: BarChartProps) {
  if (loading) return <ChartSkeleton />

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke="var(--text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          stroke="var(--text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{ paddingBottom: 20 }}
          formatter={(value) => <span className="text-sm text-[var(--text-secondary)]">{value}</span>}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name || bar.key}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

// Period selector for charts
export function ChartPeriodSelector({
  value,
  onChange,
  options = ['7d', '30d', '90d', '1y'],
}: {
  value: string
  onChange: (value: string) => void
  options?: string[]
}) {
  const labels: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
    '1y': '1 year',
  }

  return (
    <div className="flex items-center bg-[var(--surface-subtle)] rounded-lg p-0.5">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md transition-colors
            ${value === option
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }
          `}
        >
          {labels[option] || option}
        </button>
      ))}
    </div>
  )
}
