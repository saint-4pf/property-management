import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import { tenantsAPI } from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { formatDate } from '../utils/formatters'

const Tenants = () => {
  const { data: tenants, loading, error, refetch } =
    useFetch(tenantsAPI.getAll)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '',
    national_id: '', emergency_contact_name: '',
    emergency_contact_phone: '', notes: ''
  })

  const filtered = tenants?.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.full_name.toLowerCase().includes(q) ||
      t.phone.includes(q)
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      full_name: '', phone: '', email: '',
      national_id: '', emergency_contact_name: '',
      emergency_contact_phone: '', notes: ''
    })
    setFormError('')
    setModal(true)
  }

  const openEdit = (tenant) => {
    setEditing(tenant)
    setForm({
      full_name: tenant.full_name,
      phone: tenant.phone,
      email: tenant.email || '',
      national_id: tenant.national_id || '',
      emergency_contact_name:
        tenant.emergency_contact_name || '',
      emergency_contact_phone:
        tenant.emergency_contact_phone || '',
      notes: tenant.notes || ''
    })
    setFormError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone) {
      setFormError('Name and phone are required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await tenantsAPI.update(editing.id, form)
      } else {
        await tenantsAPI.create(form)
      }
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

  const handleDeactivate = async (id) => {
    if (!window.confirm(
      'Deactivate this tenant?')) return
    try {
      await tenantsAPI.deactivate(id)
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
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
            text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered?.length || 0} tenants
          </p>
        </div>
        <Button onClick={openCreate}>
          + Add Tenant
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full max-w-sm border
            border-gray-300 rounded-lg px-3 py-2
            text-sm focus:outline-none focus:ring-2
            focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl
        border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b
            border-gray-200">
            <tr>
              {['Name', 'Phone', 'Unit', 'Lease Start',
                'Rent', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3
                  text-left text-xs font-semibold
                  text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered?.map(tenant => (
              <tr key={tenant.id}
                className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium
                    text-gray-900">
                    {tenant.full_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {tenant.email || '—'}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {tenant.phone}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {tenant.unit_number
                    ? `${tenant.unit_number} · Block ${tenant.block_name}`
                    : <span className="text-gray-400
                        italic">No unit</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(tenant.start_date)}
                </td>
                <td className="px-4 py-3 font-medium
                  text-gray-900">
                  {tenant.annual_rent
                    ? `GHS ${Number(tenant.annual_rent)
                        .toLocaleString()}/yr`
                    : '—'
                  }
                </td>
                <td className="px-4 py-3">
                  <Badge status={tenant.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(tenant)}
                    >
                      Edit
                    </Button>
                    {tenant.status === 'active' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          handleDeactivate(tenant.id)
                        }
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered?.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500">
              No tenants found
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing
          ? 'Edit Tenant'
          : 'Add New Tenant'
        }
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
            {[
              {
                label: 'Full Name *',
                key: 'full_name',
                placeholder: 'James Mwangi'
              },
              {
                label: 'Phone *',
                key: 'phone',
                placeholder: '0712345678'
              },
              {
                label: 'Email',
                key: 'email',
                placeholder: 'james@email.com'
              },
              {
                label: 'National ID',
                key: 'national_id',
                placeholder: '12345678'
              },
              {
                label: 'Emergency Contact Name',
                key: 'emergency_contact_name',
                placeholder: 'Jane Mwangi'
              },
              {
                label: 'Emergency Contact Phone',
                key: 'emergency_contact_phone',
                placeholder: '0798765432'
              }
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm
                  font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={e => setForm({
                    ...form,
                    [field.key]: e.target.value
                  })}
                  placeholder={field.placeholder}
                  className="w-full border
                    border-gray-300 rounded-lg
                    px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-indigo-500"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({
                  ...form, notes: e.target.value
                })}
                rows={2}
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
              {saving ? 'Saving...' : (
                editing
                  ? 'Update Tenant'
                  : 'Create Tenant'
              )}
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

export default Tenants