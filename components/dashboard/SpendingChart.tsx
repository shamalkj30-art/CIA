'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Purchase {
  id: string
  purchase_date?: string
  price?: number
}

interface SpendingChartProps {
  purchases: Purchase[]
}

type Period = '3M' | '6M' | '1Y'

export function SpendingChart({ purchases }: SpendingChartProps) {
  const [period, setPeriod] = useState<Period>('6M')

  const chartData = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let groupBy: 'week' | 'month'

    switch (period) {
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        groupBy = 'week'
        break
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        groupBy = 'month'
        break
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        groupBy = 'month'
        break
    }

    // Filter purchases within the period
    const filteredPurchases = purchases.filter(p => {
      if (!p.purchase_date) return false
      const date = new Date(p.purchase_date)
      return date >= startDate && date <= now
    })

    // Group by period
    const grouped: Record<string, number> = {}

    if (groupBy === 'week') {
      // For 3M, show weekly data
      let current = new Date(startDate)
      while (current <= now) {
        const weekStart = new Date(current)
        const weekKey = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
        grouped[weekKey] = 0
        current.setDate(current.getDate() + 7)
      }

      filteredPurchases.forEach(p => {
        if (!p.purchase_date) return
        const date = new Date(p.purchase_date)
        const weekNum = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const weekStart = new Date(startDate)
        weekStart.setDate(weekStart.getDate() + weekNum * 7)
        const weekKey = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
        if (grouped[weekKey] !== undefined) {
          grouped[weekKey] += p.price || 0
        }
      })
    } else {
      // For 6M and 1Y, show monthly data
      let current = new Date(startDate)
      while (current <= now) {
        const monthKey = current.toLocaleDateString('en-US', { month: 'short' })
        grouped[monthKey] = 0
        current.setMonth(current.getMonth() + 1)
      }

      filteredPurchases.forEach(p => {
        if (!p.purchase_date) return
        const date = new Date(p.purchase_date)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
        if (grouped[monthKey] !== undefined) {
          grouped[monthKey] += p.price || 0
        }
      })
    }

    return Object.entries(grouped).map(([name, amount]) => ({
      name,
      amount: Math.round(amount),
    }))
  }, [purchases, period])

  // Calculate total for the period
  const total = chartData.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Spending Analytics
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            kr {total.toLocaleString()} total
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 p-1 bg-[var(--surface-subtle)] rounded-lg">
          {(['3M', '6M', '1Y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-all
                ${period === p
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        kr {payload[0].value?.toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {payload[0].payload.name}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#spendingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
