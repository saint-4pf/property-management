import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import {
  transactionsAPI, leasesAPI, tenantsAPI
} from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { formatCurrency, formatDate }
  from '../utils/formatters'

const CATEGORIES = {
  income: [
    'rent', 'deposit', 'utility_water',
    'utility_garbage', 'other_income'
  ],
  expense: [
    'diesel', 'repairs', 'salaries',
    'transport', 'materials', 'other_expense'
  ]
}

const ACCOUNT_MAP = {
  rent: 'rent', deposit: 'rent',
  utility_water: 'utility',
  utility_garbage: 'utility',
  diesel: 'imprest', repairs: 'imprest',
  salaries: 'imprest', transport: 'imprest',
  materials: 'imprest', other_expense: 'imprest',
  other_income: 'imprest'
}

const Transactions = () => {
  const { data: transactions, loading, refetch } =
    useFetch(transactionsAPI.getAll)
  const { data: balances, refetch: refetchBalances } =
    useFetch(transactionsAPI.getBalances)
  const { data: leases } =
    useFetch(leasesAPI.getAll)
  const { data: tenants } =
    useFetch(tenantsAPI.getAll)

  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterAccount, setFilterAccount] = useState('')

  const [form, setForm] = useState({
    type: 'income',
    category: 'rent',
    account: 'rent',
    amount: '',
    transaction_date: new Date()
      .toISOString().slice(0, 10),
    payment_method: 'cash',
    lease_id: '',
    tenant_id: '',
    billing_month: '',
    description: '',
    reference_number: ''
  })

  const handleCategoryChange = (category) => {
    const account = ACCOUNT_MAP[category] || 'imprest'
    setForm({ ...form, category, account })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category) {
      setFormError('Amount and category are required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await transactionsAPI.create({
        ...form,
        amount: parseFloat(form.amount)
      })
      setModal(false)
      refetch()
      refetchBalances()
    } catch (err) {
      setFormError(
        err.response?.data?.error || 'Failed to save'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleVoid = async (id) => {
    const reason = window.prompt(
      'Reason for voiding this transaction?'
    )
    if (!reason) return
    try {
      await transactionsAPI.void(id, reason)
      refetch()
      refetchBalances()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  const filtered = transactions?.filter(t => {
    if (filterType && t.type !== filterType)
      return false
    if (filterAccount && t.account !== filterAccount)
      return false
    return true
  })

  const isUtility = ['utility_water',
    'utility_garbage'].includes(form.category)

  if (loading) return (
    <div className="flex items-center
      justify-center h-64 text-gray-500">
      Loading...
    </div>
  )

  return (
    <div>
      <div className="flex items-center
        justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {transactions?.length || 0} records
          </p>
        </div>
        <Button onClick={() => {
          setFormError('')
          setModal(true)
        }}>
          + Record Transaction
        </Button>
      </div>

      {/* Account Balance Cards */}
      {balances?.accounts && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {balances.accounts.map(acc => (
            <div key={acc.account}
              className="bg-white rounded-xl
                border border-gray-200 p-4">
              <p className="text-xs font-semibold
                text-gray-500 uppercase mb-1">
                {acc.account} Account
              </p>
              <p className="text-xl font-bold
                text-gray-900">
                {formatCurrency(acc.balance)}
              </p>
              <div className="flex gap-3 mt-1
                text-xs text-gray-500">
                <span className="text-green-600">
                  In: {formatCurrency(acc.total_income)}
                </span>
                <span className="text-red-600">
                  Out: {formatCurrency(acc.total_expenses)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg
            px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={filterAccount}
          onChange={e =>
            setFilterAccount(e.target.value)
          }
          className="border border-gray-300 rounded-lg
            px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Accounts</option>
          <option value="rent">Rent</option>
          <option value="utility">Utility</option>
          <option value="imprest">Imprest</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl
        border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b
            border-gray-200">
            <tr>
              {['Date', 'Description', 'Category',
                'Account', 'Type', 'Amount',
                'Actions'].map(h => (
                <th key={h} className="px-4 py-3
                  text-left text-xs font-semibold
                  text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered?.map(tx => (
              <tr key={tx.id}
                className={`hover:bg-gray-50 ${
                  tx.is_voided
                    ? 'opacity-40 line-through' : ''
                }`}>
                <td className="px-4 py-3 text-sm
                  text-gray-600">
                  {formatDate(tx.transaction_date)}
                </td>
                <td className="px-4 py-3 text-sm
                  text-gray-800">
                  {tx.description || '—'}
                  {tx.tenant_name && (
                    <div className="text-xs text-gray-400">
                      {tx.tenant_name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm
                  text-gray-600 capitalize">
                  {tx.category?.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 text-sm
                  capitalize text-gray-600">
                  {tx.account}
                </td>
                <td className="px-4 py-3">
                  <Badge status={tx.type} />
                </td>
                <td className={`px-4 py-3 font-semibold
                  ${tx.type === 'income'
                    ? 'text-green-600'
                    : 'text-red-600'
                  }`}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-3">
                  {!tx.is_voided && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleVoid(tx.id)}
                    >
                      Void
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered?.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-gray-500">
              No transactions yet
            </p>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Record Transaction"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="bg-red-50 border
              border-red-200 rounded-lg p-3
              text-red-700 text-sm mb-4">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={form.type}
                onChange={e => setForm({
                  ...form, type: e.target.value,
                  category: e.target.value === 'income'
                    ? 'rent' : 'diesel',
                  account: e.target.value === 'income'
                    ? 'rent' : 'imprest'
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={e =>
                  handleCategoryChange(e.target.value)
                }
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                {CATEGORIES[form.type].map(c => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')
                      .replace(/\b\w/g,
                        l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Account (auto-set, read only) */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Account
              </label>
              <input
                type="text"
                value={form.account.toUpperCase()}
                readOnly
                className="w-full border border-gray-200
                  rounded-lg px-3 py-2 text-sm
                  bg-gray-50 text-gray-600 capitalize"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Amount (GHS) *
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({
                  ...form, amount: e.target.value
                })}
                placeholder="e.g. 15000"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={e => setForm({
                  ...form,
                  transaction_date: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={form.payment_method}
                onChange={e => setForm({
                  ...form,
                  payment_method: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">Momo</option>
                <option value="bank_transfer">
                  Bank Transfer
                </option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Tenant */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Tenant (optional)
              </label>
              <select
                value={form.tenant_id}
                onChange={e => setForm({
                  ...form, tenant_id: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="">No tenant</option>
                {tenants?.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lease */}
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Lease (optional)
              </label>
              <select
                value={form.lease_id}
                onChange={e => setForm({
                  ...form, lease_id: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="">No lease</option>
                {leases?.filter(l =>
                  l.status === 'active'
                ).map(l => (
                  <option key={l.id} value={l.id}>
                    {l.tenant_name} — {l.unit_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Month — only for utilities */}
            {isUtility && (
              <div className="col-span-2">
                <label className="block text-sm
                  font-medium text-gray-700 mb-1">
                  Billing Month * (required for utilities)
                </label>
                <input
                  type="month"
                  value={form.billing_month}
                  onChange={e => setForm({
                    ...form,
                    billing_month: e.target.value
                  })}
                  className="w-full border border-gray-300
                    rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({
                  ...form, description: e.target.value
                })}
                placeholder="Optional description"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving
                ? 'Saving...'
                : 'Record Transaction'
              }
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Transactions