import { useState } from 'react'
import useFetch from '../hooks/useFetch'
import { blocksAPI } from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const Blocks = () => {
  const { data: blocks, loading, error, refetch } =
    useFetch(blocksAPI.getAll)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', description: ''
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setFormError('')
    setModal(true)
  }

  const openEdit = (block) => {
    setEditing(block)
    setForm({
      name: block.name,
      description: block.description || ''
    })
    setFormError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Block name is required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await blocksAPI.update(editing.id, form)
      } else {
        await blocksAPI.create(form)
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

  const handleDelete = async (id) => {
    if (!window.confirm(
      'Deactivate this block?')) return
    try {
      await blocksAPI.delete(id)
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  if (loading) return (
    <div className="flex items-center
      justify-center h-64">
      <div className="text-gray-500">Loading...</div>
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
      {/* Header */}
      <div className="flex items-center
        justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold
            text-gray-900">
            Blocks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {blocks?.length || 0} blocks total
          </p>
        </div>
        <Button onClick={openCreate}>
          + Add Block
        </Button>
      </div>

      {/* Grid of block cards */}
      {blocks?.length === 0 ? (
        <div className="bg-white rounded-xl
          border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-gray-500 font-medium">
            No blocks yet
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Add your first block to get started
          </p>
          <Button
            className="mt-4"
            onClick={openCreate}
          >
            + Add Block
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2
          lg:grid-cols-3 gap-4">
          {blocks?.map(block => (
            <div
              key={block.id}
              className="bg-white rounded-xl
                border border-gray-200 p-5
                hover:shadow-md transition-shadow"
            >
              {/* Block name */}
              <div className="flex items-center
                justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100
                    rounded-lg flex items-center
                    justify-center">
                    <span className="text-indigo-700
                      font-bold text-lg">
                      {block.name}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold
                      text-gray-900">
                      Block {block.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {block.description || 'No description'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Unit stats */}
              <div className="grid grid-cols-3
                gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg
                  p-2 text-center">
                  <p className="text-lg font-bold
                    text-gray-900">
                    {block.total_units || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg
                  p-2 text-center">
                  <p className="text-lg font-bold
                    text-green-700">
                    {block.occupied_units || 0}
                  </p>
                  <p className="text-xs text-green-600">
                    Occupied
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg
                  p-2 text-center">
                  <p className="text-lg font-bold
                    text-blue-700">
                    {block.vacant_units || 0}
                  </p>
                  <p className="text-xs text-blue-600">
                    Vacant
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(block)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(block.id)}
                  className="flex-1"
                >
                  Deactivate
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Block' : 'Add New Block'}
        size="sm"
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="bg-red-50 border
              border-red-200 rounded-lg p-3
              text-red-700 text-sm mb-4">
              {formError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Block Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({
                  ...form, name: e.target.value
                })}
                placeholder="e.g. A, B, C"
                className="w-full border border-gray-300
                  rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2
                  focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm
                font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({
                  ...form,
                  description: e.target.value
                })}
                placeholder="e.g. Main residential block"
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
                editing ? 'Update Block' : 'Create Block'
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

export default Blocks