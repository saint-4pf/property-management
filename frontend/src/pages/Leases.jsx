import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import {
  leasesAPI, tenantsAPI, unitsAPI
} from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import {
  formatCurrency, formatDate
} from '../utils/formatters'

const Leases = () => {
  const { data: leases, loading, refetch } =
    useFetch(leasesAPI.getAll)
  const { data: tenants } =
    useFetch(tenantsAPI.getAll)
  const { data: units } =
    useFetch(() => unitsAPI.getAll({ status: 'vacant' }))

  const [modal, setModal] = useState(false)
  const [summaryModal, setSummaryModal] = useState(false)
  const [summary, setSummary] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    tenant_id: '', unit_id: '',
    annual_rent: '', water_monthly: '',
    garbage_monthly: '', deposit_amount: '',
    deposit_paid: false,
    start_date: '', end_date: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tenant_id || !form.unit_id
      || !form.annual_rent
      || !form.start_date || !form.end_date) {
      setFormError('All required fields must be filled')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await leasesAPI.create({
        ...form,
        annual_rent: parseFloat(form.annual_rent),
        water_monthly:
          parseFloat(form.water_monthly) || 0,
        garbage_monthly:
          parseFloat(form.garbage_monthly) || 0,
        deposit_amount:
          parseFloat(form.deposit_amount) || 0
      })
      setModal(false)
      refetch()
    } catch (err) {
      setFormError(
        err.response?.data?.error || 'Failed to save'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleViewSummary = async (leaseId) => {
    try {
      const res = await leasesAPI.getSummary(leaseId)
      setSummary(res.data.data)
      setSummaryModal(true)
    } catch (err) {
      alert('Failed to load summary')
    }
  }

  const handleTerminate = async (id) => {
    const reason = window.prompt(
      'Reason for termination?'
    )
    if (!reason) return
    try {
      await leasesAPI.terminate(id, reason)
      refetch()
    } catch (err) {
      alert(err.response?.data?.error ||
        'Cannot terminate. Check for outstanding balance.')
    }
  }

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
            text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-1">
            {leases?.filter(l =>
              l.status === 'active'
            ).length || 0} active leases
          </p>
        </div>
        <Button onClick={() => {
          setForm({
            tenant_id: '', unit_id: '',
            annual_rent: '', water_monthly: '',
            garbage_monthly: '', deposit_amount: '',
            deposit_paid: false,
            start_date: '', end_date: ''
          })
          setFormError('')
          setModal(true)
        }}>
          + New Lease
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl
        border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b
            border-gray-200">
            <tr>
              {['Tenant', 'Unit', 'Annual Rent',
                'Utilities/mo', 'Period',
                'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3
                  text-left text-xs font-semibold
                  text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leases?.map(lease => (
              <tr key={lease.id}
                className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium
                    text-gray-900">
                    {lease.tenant_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {lease.tenant_phone}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {lease.unit_number} ·
                  Block {lease.block_name}
                </td>
                <td className="px-4 py-3 font-medium
                  text-gray-900">
                  {formatCurrency(lease.annual_rent)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatCurrency(
                    parseFloat(lease.water_monthly || 0)
                    + parseFloat(
                      lease.garbage_monthly || 0
                    )
                  )}
                </td>
                <td className="px-4 py-3 text-sm
                  text-gray-600">
                  <div>
                    {formatDate(lease.start_date)}
                  </div>
                  <div className="text-xs text-gray-400">
                    to {formatDate(lease.end_date)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge status={lease.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleViewSummary(lease.id)
                      }
                    >
                      Summary
                    </Button>
                    {lease.status === 'active' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          handleTerminate(lease.id)
                        }
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leases?.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500">
              No leases yet
            </p>
          </div>
        )}
      </div>

      {/* New Lease Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Create New Lease"
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
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Tenant *
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
                <option value="">Select tenant</option>
                {tenants?.filter(t =>
                  t.status === 'active'
                ).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                value={form.unit_id}
                onChange={e => setForm({
                  ...form, unit_id: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="">Select unit</option>
                {units?.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.unit_number} —
                    Block {u.block_name} —
                    {formatCurrency(u.base_rent)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Annual Rent (GHS) *
              </label>
              <input
                type="number"
                value={form.annual_rent}
                onChange={e => setForm({
                  ...form, annual_rent: e.target.value
                })}
                placeholder="e.g. 180000"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Deposit Amount (GHS)
              </label>
              <input
                type="number"
                value={form.deposit_amount}
                onChange={e => setForm({
                  ...form,
                  deposit_amount: e.target.value
                })}
                placeholder="e.g. 15000"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Water Monthly (GHS)
              </label>
              <input
                type="number"
                value={form.water_monthly}
                onChange={e => setForm({
                  ...form,
                  water_monthly: e.target.value
                })}
                placeholder="e.g. 500"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Garbage Monthly (GHS)
              </label>
              <input
                type="number"
                value={form.garbage_monthly}
                onChange={e => setForm({
                  ...form,
                  garbage_monthly: e.target.value
                })}
                placeholder="e.g. 300"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Lease Start Date *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({
                  ...form, start_date: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Lease End Date *
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({
                  ...form, end_date: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center
                gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.deposit_paid}
                  onChange={e => setForm({
                    ...form,
                    deposit_paid: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-sm
                  text-gray-700">
                  Deposit already paid
                </span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Create Lease'}
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

      {/* Lease Summary Modal */}
      {summary && (
        <Modal
          isOpen={summaryModal}
          onClose={() => setSummaryModal(false)}
          title={`Lease Summary — ${summary.lease?.tenant_name}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Rent Status */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold
                text-gray-700 mb-3">
                Rent
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Annual Amount
                  </p>
                  <p className="text-lg font-bold
                    text-gray-900">
                    {formatCurrency(
                      summary.rent?.annual_amount
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Total Paid
                  </p>
                  <p className="text-lg font-bold
                    text-green-600">
                    {formatCurrency(
                      summary.rent?.total_paid
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Outstanding
                  </p>
                  <p className={`text-lg font-bold ${
                    summary.rent?.outstanding > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(
                      summary.rent?.outstanding
                    )}
                  </p>
                </div>
              </div>
              {summary.rent?.is_fully_paid && (
                <div className="mt-2 text-center
                  text-green-600 text-sm font-medium">
                  ✅ Fully Paid
                </div>
              )}
            </div>

            {/* Utilities Status */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold
                text-gray-700 mb-3">
                Utilities
              </h3>
              <div className="grid grid-cols-2 gap-3
                mb-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Monthly Due
                  </p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(
                      summary.utilities?.monthly_amount
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Utility Outstanding
                  </p>
                  <p className={`font-bold ${
                    summary.utilities?.outstanding > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(
                      summary.utilities?.outstanding
                    )}
                  </p>
                </div>
              </div>
              {summary.utilities?.unpaid_months
                ?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500
                    mb-1">
                    Unpaid months:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {summary.utilities.unpaid_months
                      .map(m => (
                      <span key={m}
                        className="bg-red-100
                          text-red-700 text-xs
                          px-2 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className={`rounded-xl p-4 ${
              summary.total_outstanding > 0
                ? 'bg-red-50'
                : 'bg-green-50'
            }`}>
              <div className="flex items-center
                justify-between">
                <span className="font-semibold
                  text-gray-700">
                  Total Outstanding
                </span>
                <span className={`text-xl font-bold ${
                  summary.total_outstanding > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {formatCurrency(
                    summary.total_outstanding
                  )}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Leases