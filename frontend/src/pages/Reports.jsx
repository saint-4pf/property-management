import useFetch from '../hooks/useFetch'
import { reportsAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const Reports = () => {
  const { data: dashboard } =
    useFetch(reportsAPI.getDashboard)
  const { data: trends, loading } =
    useFetch(reportsAPI.getIncomeVsExpenses)

  if (loading) return (
    <div className="flex items-center
      justify-center h-64 text-gray-500">
      Loading reports...
    </div>
  )

  const {
    account_balances = [],
    outstanding_rent = [],
    expense_breakdown = []
  } = dashboard || {}

  const totalIncome = account_balances.reduce(
    (s, a) => s + parseFloat(a.income || 0), 0
  )
  const totalExpenses = account_balances.reduce(
    (s, a) => s + parseFloat(a.expenses || 0), 0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold
          text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Financial performance summary
        </p>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl
        border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b
          border-gray-100">
          <h3 className="font-semibold text-gray-700">
            Account Summary
          </h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b
            border-gray-200">
            <tr>
              {['Account', 'Total Income',
                'Total Expenses', 'Balance'].map(h => (
                <th key={h} className="px-5 py-3
                  text-left text-xs font-semibold
                  text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {account_balances.map(acc => (
              <tr key={acc.account}
                className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium
                  text-gray-900 capitalize">
                  {acc.account}
                </td>
                <td className="px-5 py-3
                  text-green-600 font-medium">
                  {formatCurrency(acc.income)}
                </td>
                <td className="px-5 py-3
                  text-red-600 font-medium">
                  {formatCurrency(acc.expenses)}
                </td>
                <td className={`px-5 py-3 font-bold ${
                  parseFloat(acc.balance) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formatCurrency(acc.balance)}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-gray-50 font-bold">
              <td className="px-5 py-3 text-gray-900">
                TOTAL
              </td>
              <td className="px-5 py-3 text-green-700">
                {formatCurrency(totalIncome)}
              </td>
              <td className="px-5 py-3 text-red-700">
                {formatCurrency(totalExpenses)}
              </td>
              <td className={`px-5 py-3 ${
                totalIncome - totalExpenses >= 0
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}>
                {formatCurrency(
                  totalIncome - totalExpenses
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-xl
        border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700
          mb-4">
          Monthly Income vs Expenses
        </h3>
        {trends && trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
              />
              <XAxis dataKey="month"
                tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v =>
                  `${(v/1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={v => formatCurrency(v)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                name="Income"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#6366f1"
                strokeWidth={2}
                name="Net"
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center
            justify-center h-48 text-gray-400">
            No data yet. Record transactions to
            see monthly trends.
          </div>
        )}
      </div>

      {/* Expense Breakdown Chart */}
      {expense_breakdown.length > 0 && (
        <div className="bg-white rounded-xl
          border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700
            mb-4">
            Expense Breakdown by Category
          </h3>
          <ResponsiveContainer
            width="100%" height={250}>
            <BarChart data={expense_breakdown}
              layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
              />
              <XAxis type="number"
                tickFormatter={v =>
                  `${(v/1000).toFixed(0)}k`
                }
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip
                formatter={v => formatCurrency(v)}
              />
              <Bar dataKey="total"
                fill="#6366f1"
                name="Amount"
                radius={[0,4,4,0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Outstanding Rent */}
      {outstanding_rent.length > 0 && (
        <div className="bg-white rounded-xl
          border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b
            border-gray-100">
            <h3 className="font-semibold text-gray-700">
              Outstanding Rent Balances
            </h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b
              border-gray-200">
              <tr>
                {['Tenant', 'Unit', 'Annual Rent',
                  'Paid', 'Outstanding'].map(h => (
                  <th key={h} className="px-5 py-3
                    text-left text-xs font-semibold
                    text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y
              divide-gray-100">
              {outstanding_rent.map((item, i) => (
                <tr key={i}
                  className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium
                    text-gray-900">
                    {item.tenant_name}
                  </td>
                  <td className="px-5 py-3
                    text-gray-600">
                    {item.unit_number} ·
                    Block {item.block_name}
                  </td>
                  <td className="px-5 py-3
                    text-gray-900">
                    {formatCurrency(item.annual_rent)}
                  </td>
                  <td className="px-5 py-3
                    text-green-600 font-medium">
                    {formatCurrency(item.rent_paid)}
                  </td>
                  <td className="px-5 py-3 font-bold
                    text-red-600">
                    {formatCurrency(item.outstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Reports