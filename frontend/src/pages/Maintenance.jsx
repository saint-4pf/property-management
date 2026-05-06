import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import {
  maintenanceAPI, blocksAPI, unitsAPI
} from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { formatDate } from '../utils/formatters'

const Maintenance = () => {
  const { data: records, loading, refetch } =
    useFetch(maintenanceAPI.getAll)
  const { data: blocks } = useFetch(blocksAPI.getAll)
  const { data: units } = useFetch(unitsAPI.getAll)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    block_id: '', unit_id: '', title: '',
    description: '', work_done: '',
    reported_by: '', priority: 'medium',
    status: 'reported', reported_date: '',
    completed_date: ''
  })

  const filtered = records?.filter(r => {
    if (filterStatus && r.status !== filterStatus)
      return false
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      block_id: '', unit_id: '', title: '',
      description: '', work_done: '',
      reported_by: '', priority: 'medium',
      status: 'reported',
      reported_date: new Date()
        .toISOString().slice(0, 10),
      completed_date: ''
    })
    setFormError('')
    setModal(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    setForm({
      block_id: record.block_id || '',
      unit_id: record.unit_id || '',
      title: record.title,
      description: record.description,
      work_done: record.work_done || '',
      reported_by: record.reported_by || '',
      priority: record.priority,
      status: record.status,
      reported_date: record.reported_date
        ?.slice(0, 10) || '',
      completed_date: record.completed_date
        ?.slice(0, 10) || ''
    })
    setFormError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.block_id || !form.title
      || !form.description) {
      setFormError(
        'Block, title and description are required'
      )
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await maintenanceAPI.update(editing.id, form)
      } else {
        await maintenanceAPI.create(form)
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

  const priorityColors = {
    urgent: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-gray-300'
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
            text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-1">
            {records?.filter(r =>
              r.status !== 'completed'
            ).length || 0} open issues
          </p>
        </div>
        <Button onClick={openCreate}>
          + Log Issue
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-5">
        <select
          value={filterStatus}
          onChange={e =>
            setFilterStatus(e.target.value)
          }
          className="border border-gray-300 rounded-lg
            px-3 py-2 text-sm focus:outline-none
            focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="deferred">Deferred</option>
        </select>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered?.map(record => (
          <div
            key={record.id}
            className={`bg-white rounded-xl
              border border-gray-200 border-l-4 p-4
              ${priorityColors[record.priority]}
              hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start
              justify-between">
              <div className="flex-1">
                <div className="flex items-center
                  gap-2 mb-1">
                  <h3 className="font-semibold
                    text-gray-900">
                    {record.title}
                  </h3>
                  <Badge status={record.priority} />
                  <Badge status={record.status}
                    label={record.status
                      .replace('_', ' ')} />
                </div>
                <p className="text-sm text-gray-600
                  mb-2">
                  {record.description}
                </p>
                <div className="flex gap-4 text-xs
                  text-gray-400">
                  <span>
                    Block {record.block_name}
                    {record.unit_number &&
                      ` · Unit ${record.unit_number}`
                    }
                  </span>
                  <span>
                    Reported: {formatDate(
                      record.reported_date
                    )}
                  </span>
                  {record.reported_by && (
                    <span>By: {record.reported_by}</span>
                  )}
                </div>
                {record.work_done && (
                  <p className="text-sm text-green-700
                    bg-green-50 rounded-lg px-3 py-1
                    mt-2">
                    ✅ {record.work_done}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEdit(record)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
        {filtered?.length === 0 && (
          <div className="bg-white rounded-xl
            border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🔧</p>
            <p className="text-gray-500">
              No maintenance records
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing
          ? 'Update Maintenance Record'
          : 'Log Maintenance Issue'
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
                Unit (optional)
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
                <option value="">No specific unit</option>
                {units?.filter(u =>
                  !form.block_id ||
                  u.block_id === form.block_id
                ).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.unit_number}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Issue Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({
                  ...form, title: e.target.value
                })}
                placeholder="e.g. Leaking roof in B2"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm({
                  ...form, description: e.target.value
                })}
                rows={2}
                placeholder="Describe the issue..."
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={e => setForm({
                  ...form, priority: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm({
                  ...form, status: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              >
                <option value="reported">Reported</option>
                <option value="in_progress">
                  In Progress
                </option>
                <option value="completed">
                  Completed
                </option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Reported By
              </label>
              <input
                type="text"
                value={form.reported_by}
                onChange={e => setForm({
                  ...form, reported_by: e.target.value
                })}
                placeholder="Tenant or staff name"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Reported Date
              </label>
              <input
                type="date"
                value={form.reported_date}
                onChange={e => setForm({
                  ...form,
                  reported_date: e.target.value
                })}
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            {form.status === 'completed' && (
              <div className="col-span-2">
                <label className="block text-sm
                  font-medium text-gray-700 mb-1">
                  Work Done
                </label>
                <textarea
                  value={form.work_done}
                  onChange={e => setForm({
                    ...form, work_done: e.target.value
                  })}
                  rows={2}
                  placeholder="Describe what was fixed..."
                  className="w-full border border-gray-300
                    rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2
                    focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : (
                editing ? 'Update Record' : 'Log Issue'
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

export default Maintenance