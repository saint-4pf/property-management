import useFetch from '../hooks/useFetch'
import { reportsAPI } from '../services/api'
import StatCard from '../components/ui/StatCard'
import { formatCurrency, formatDate }
  from '../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const Dashboard = () => {
  const { data: dashboard, loading, error } =
    useFetch(reportsAPI.getDashboard)
  const { data: trends } =
    useFetch(reportsAPI.getIncomeVsExpenses)

  if (loading) return (
    <div className="flex items-center
      justify-center h-64 text-gray-500">
      Loading dashboard...
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200
      rounded-lg p-4 text-red-700">
      Error loading dashboard: {error}
    </div>
  )

  const {
    account_balances = [],
    occupancy = {},
    outstanding_rent = [],
    recent_transactions = [],
    expense_breakdown = []
  } = dashboard || {}

  // Compute totals from account balances
 const totalIncome = account_balances.reduce(
  (s, a) => s + parseFloat(a.total_income || 0), 0
)
const totalExpenses = account_balances.reduce(
  (s, a) => s + parseFloat(a.total_expenses || 0), 0
)
  const netBalance = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold
          text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Financial overview and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2
        lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={totalIncome}
          isCurrency
          color="green"
          icon="📈"
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses}
          isCurrency
          color="red"
          icon="📉"
        />
        <StatCard
          title="Net Balance"
          value={netBalance}
          isCurrency
          color={netBalance >= 0 ? 'indigo' : 'red'}
          icon="💰"
        />
        <StatCard
          title="Occupancy Rate"
          value={occupancy?.total > 0
            ? `${Math.round(
                (occupancy.occupied /
                  occupancy.total) * 100
              )}%`
            : '0%'
          }
          color="blue"
          icon="🏠"
          subtitle={`${occupancy?.occupied || 0} of
            ${occupancy?.total || 0} units`}
        />
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1
        md:grid-cols-3 gap-4">
        {account_balances.map(acc => (
          <div key={acc.account}
            className="bg-white rounded-xl
              border border-gray-200 p-5">
            <div className="flex items-center
              justify-between mb-2">
              <h3 className="text-sm font-semibold
                text-gray-600 uppercase">
                {acc.account} Account
              </h3>
              <span className={`text-xs px-2 py-0.5
                rounded-full font-medium ${
                parseFloat(acc.balance) >= 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {parseFloat(acc.balance) >= 0
                  ? 'Positive' : 'Deficit'}
              </span>
            </div>
            <p className="text-2xl font-bold
              text-gray-900">
              {formatCurrency(acc.balance)}
            </p>
            <div className="flex gap-4 mt-2
              text-xs text-gray-500">
              <span>
                In:{' '}
  <span className="text-green-600 font-medium">
  {formatCurrency(acc.total_income)}
</span>
              </span>
              <span>
                Out:{' '}
                <span className="text-red-600 font-medium">
  {formatCurrency(acc.total_expenses)}
</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Outstanding */}
      <div className="grid grid-cols-1
        lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="lg:col-span-2 bg-white
          rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold
            text-gray-700 mb-4">
            Income vs Expenses (Monthly)
          </h3>
          {trends && trends.length > 0 ? (
            <ResponsiveContainer
              width="100%" height={240}>
              <BarChart data={trends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                />
                <XAxis dataKey="month"
                  tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }}
                  tickFormatter={v =>
                    `${(v/1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  formatter={v => formatCurrency(v)}
                />
                <Legend />
                <Bar dataKey="income"
                  fill="#10b981" name="Income"
                  radius={[4,4,0,0]} />
                <Bar dataKey="expenses"
                  fill="#ef4444" name="Expenses"
                  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center
              justify-center h-48 text-gray-400">
              No transaction data yet.
              Record transactions to see chart.
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl
          border border-gray-200 p-5">
          <h3 className="text-sm font-semibold
            text-gray-700 mb-4">
            Expense Breakdown
          </h3>
          {expense_breakdown.length > 0 ? (
            <div className="space-y-2">
              {expense_breakdown.map(item => (
                <div key={item.category}
                  className="flex items-center
                  justify-between">
                  <span className="text-sm
                    text-gray-600 capitalize">
                    {item.category?.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium
                    text-gray-900">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm
              text-center mt-8">
              No expenses recorded yet
            </p>
          )}
        </div>
      </div>

      {/* Outstanding Rent Alerts */}
      {outstanding_rent.length > 0 && (
        <div className="bg-amber-50 border
          border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold
            text-amber-800 mb-3">
            ⚠️ Outstanding Rent (
            {outstanding_rent.length} tenants)
          </h3>
          <div className="space-y-2">
            {outstanding_rent.map((item, i) => (
              <div key={i}
                className="flex items-center
                  justify-between bg-white
                  rounded-lg px-4 py-2">
                <div>
                  <p className="font-medium
                    text-gray-900 text-sm">
                    {item.tenant_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.unit_number} ·
                    Block {item.block_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold
                    text-red-600 text-sm">
                    {formatCurrency(item.outstanding)}
                  </p>
                  <p className="text-xs text-gray-400">
                    outstanding
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl
        border border-gray-200">
        <div className="px-5 py-4 border-b
          border-gray-100">
          <h3 className="text-sm font-semibold
            text-gray-700">
            Recent Transactions
          </h3>
        </div>
        {recent_transactions.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recent_transactions.map(tx => (
              <div key={tx.id}
                className="px-5 py-3 flex items-center
                  justify-between">
                <div>
                  <p className="text-sm font-medium
                    text-gray-800">
                    {tx.description ||
                      tx.category?.replace('_', ' ')
                    }
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(tx.transaction_date)}
                    {tx.tenant_name &&
                      ` · ${tx.tenant_name}`
                    }
                  </p>
                </div>
                <span className={`font-semibold
                  text-sm ${
                  tx.type === 'income'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center
            text-gray-400 text-sm">
            No transactions yet.
            Start by adding blocks, units,
            tenants and leases.
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard