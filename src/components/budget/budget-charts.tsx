'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Transaction } from '@/lib/supabase/types'
import type { CategoryBreakdown } from '@/lib/supabase/grants'

// ---------------------------------------------------------------------------
// Color palette — Tailwind-compatible
// ---------------------------------------------------------------------------

const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#eab308', // yellow-500
  '#ec4899', // pink-500
]

// ---------------------------------------------------------------------------
// Pie chart — spending by category
// ---------------------------------------------------------------------------

interface CategoryPieChartProps {
  categories: CategoryBreakdown[]
}

export function CategoryPieChart({ categories }: CategoryPieChartProps) {
  const data = categories
    .filter((c) => c.spent > 0)
    .map((c) => ({
      name: c.name,
      value: c.spent,
    }))

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-400">No spending data to chart</p>
      </div>
    )
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">
        Spending by Category
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bar chart — monthly spending over time
// ---------------------------------------------------------------------------

interface MonthlyBarChartProps {
  transactions: Transaction[]
}

export function MonthlyBarChart({ transactions }: MonthlyBarChartProps) {
  // Aggregate transactions by month
  const monthlyMap: Record<string, number> = {}
  for (const tx of transactions) {
    const d = new Date(tx.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = (monthlyMap[key] ?? 0) + tx.amount
  }

  // Sort by month and format for chart
  const data = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => {
      const [year, m] = month.split('-')
      const label = new Date(Number(year), Number(m) - 1).toLocaleDateString(
        'en-US',
        { month: 'short', year: '2-digit' }
      )
      return { month: label, amount }
    })

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-400">No spending data to chart</p>
      </div>
    )
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">
        Monthly Spending
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            width={50}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar
            dataKey="amount"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
