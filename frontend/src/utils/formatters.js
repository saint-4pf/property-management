export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0
  return `GHS ${num.toLocaleString('en-GH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`
}

export const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString(
    'en-GH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )
}

export const formatBillingMonth = (month) => {
  if (!month) return '—'
  const [year, m] = month.split('-')
  const date = new Date(year, parseInt(m) - 1, 1)
  return date.toLocaleDateString('en-GH', {
    month: 'long', year: 'numeric'
  })
}

export const getStatusColor = (status) => {
  const colors = {
    occupied:    'bg-green-100 text-green-800',
    vacant:      'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    active:      'bg-green-100 text-green-800',
    expired:     'bg-gray-100 text-gray-800',
    terminated:  'bg-red-100 text-red-800',
    urgent:      'bg-red-100 text-red-800',
    high:        'bg-orange-100 text-orange-800',
    medium:      'bg-yellow-100 text-yellow-800',
    low:         'bg-gray-100 text-gray-800',
    reported:    'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed:   'bg-green-100 text-green-800',
    deferred:    'bg-gray-100 text-gray-800',
    income:      'bg-green-100 text-green-800',
    expense:     'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}