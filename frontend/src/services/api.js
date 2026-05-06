import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
})

export const blocksAPI = {
  getAll: () => api.get('/blocks'),
  getById: (id) => api.get(`/blocks/${id}`),
  create: (data) => api.post('/blocks', data),
  update: (id, data) => api.put(`/blocks/${id}`, data),
  delete: (id) => api.delete(`/blocks/${id}`)
}

export const unitsAPI = {
  getAll: (params) => api.get('/units', { params }),
  getById: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data)
}

export const tenantsAPI = {
  getAll: (params) => api.get('/tenants', { params }),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  deactivate: (id) =>
    api.patch(`/tenants/${id}/deactivate`)
}

export const leasesAPI = {
  getAll: (params) => api.get('/leases', { params }),
  getById: (id) => api.get(`/leases/${id}`),
  getSummary: (id) => api.get(`/leases/${id}/summary`),
  getTransactions: (id) =>
    api.get(`/leases/${id}/transactions`),
  getUtilityStatus: (id) =>
    api.get(`/leases/${id}/utility-status`),
  getExpiringSoon: (days = 30) =>
    api.get('/leases/expiring-soon', { params: { days } }),
  create: (data) => api.post('/leases', data),
  terminate: (id, reason) =>
    api.patch(`/leases/${id}/terminate`, { reason })
}

export const transactionsAPI = {
  getAll: (params) =>
    api.get('/transactions', { params }),
  getBalances: () => api.get('/transactions/balances'),
  create: (data) => api.post('/transactions', data),
  void: (id, reason) =>
    api.patch(`/transactions/${id}/void`, { reason })
}

export const maintenanceAPI = {
  getAll: (params) =>
    api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) =>
    api.put(`/maintenance/${id}`, data)
}

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getIncomeVsExpenses: () =>
    api.get('/reports/income-vs-expenses')
}

export default api