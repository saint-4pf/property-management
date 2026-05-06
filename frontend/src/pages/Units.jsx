import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import { unitsAPI, blocksAPI } from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { formatCurrency } from '../utils/formatters'

const Units = () => {
  const { data: units, loading, error, refetch } =
    useFetch(unitsAPI.getAll)
  const { data: blocks } = useFetch(blocksAPI.getAll)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterBlock, setFilterBlock] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    block_id: '', unit_number: '',
    unit_type: 'residential',
    size_description: '', base_rent: '',
    status: 'vacant', notes: ''
  })

  const filtered = units?.filter(u => {
    if (filterBlock && u.block_id !== filterBlock)
      return false
    if (filterStatus && u.status !== filterStatus)
      return false
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      block_id: '', unit_number: '',
      unit_type: 'residential',
      size_description: '', base_rent: '',
      status: 'vacant', notes: ''
    })
    setFormError('')
    setModal(true)
  }

  const openEdit = (unit) => {
    setEditing(unit)
    setForm({
      block_id: unit.block_id,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      size_description: unit.size_description || '',
      base_rent: unit.base_rent,
      status: unit.status,
      notes: unit.notes || ''
    })
    setFormError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.block_id || !form.unit_number
      || !form.base_rent) {
      setFormError(
        'Block, unit number and rent are required'
      )
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        block_id: form.block_id,
        unit_number: form.unit_number,
        unit_type: form.unit_type || 'residential',
        size_description: form.size_description || null,
        base_rent: parseFloat(form.base_rent),
        status: 'vacant',
        notes: form.notes || null
      }
      if (editing) {
        await unitsAPI.update(editing.id, payload)
      } else {
        await unitsAPI.create(payload)
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

  if (loading) return (
    <div className="flex items-center
      justify-center h-64 text-gray-500">
      Loading...
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200
      rounded-lg p-4 text-red-700">
      Error: {error}
    </div>
  )

  return (
    <div>
      <div className="flex items-center
        justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900">Units</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered?.length || 0} units
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Unit</Button>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={filterBlock}
          onChange={e => setFilterBlock(e.target.value)}
          className="border border-gray-300 rounded-lg
            px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Blocks</option>
          {blocks?.map(b => (
            <option key={b.id} value={b.id}>
              Block {b.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg
            px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="vacant">Vacant</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="bg-white rounded-xl
        border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b
            border-gray-200">
            <tr>
              {['Unit', 'Block', 'Type', 'Size',
                'Base Rent', 'Status', 'Tenant',
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
            {filtered?.map(unit => (
              <tr key={unit.id}
                className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold
                  text-gray-900">
                  {unit.unit_number}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  Block {unit.block_name}
                </td>
                <td className="px-4 py-3 capitalize
                  text-gray-600">
                  {unit.unit_type}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {unit.size_description || '—'}
                </td>
                <td className="px-4 py-3 font-medium
                  text-gray-900">
                  {formatCurrency(unit.base_rent)}
                </td>
                <td className="px-4 py-3">
                  <Badge status={unit.status} />
                </td>
                <td className="px-4 py-3 text-gray-600
                  text-sm">
                  {unit.current_tenant_name || (
                    <span className="text-gray-400
                      italic">Vacant</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(unit)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered?.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🚪</p>
            <p className="text-gray-500">
              No units found
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Unit' : 'Add New Unit'}
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
                Block *
              </label>
              <select
                value={form.block_id}
                onChange={e => setForm({
                  ...form, block_id: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="">Select block</option>
                {blocks?.map(b => (
                  <option key={b.id} value={b.id}>
                    Block {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Unit Number *
              </label>
              <input
                type="text"
                value={form.unit_number}
                onChange={e => setForm({
                  ...form,
                  unit_number: e.target.value
                })}
                placeholder="e.g. A1, B12"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={form.unit_type}
                onChange={e => setForm({
                  ...form, unit_type: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="residential">
                  Residential
                </option>
                <option value="commercial">
                  Commercial
                </option>
                <option value="storage">Storage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Size
              </label>
              <input
                type="text"
                value={form.size_description}
                onChange={e => setForm({
                  ...form,
                  size_description: e.target.value
                })}
                placeholder="e.g. 2 bedroom, shop"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Base Rent (GHS) *
              </label>
              <input
                type="number"
                value={form.base_rent}
                onChange={e => setForm({
                  ...form, base_rent: e.target.value
                })}
                placeholder="e.g. 2000"
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
                editing ? 'Update Unit' : 'Create Unit'
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

export default Units