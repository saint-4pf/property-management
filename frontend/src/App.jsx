import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Blocks from './pages/Blocks'
import Units from './pages/Units'
import Tenants from './pages/Tenants'
import Leases from './pages/Leases'
import Transactions from './pages/Transactions'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="blocks" element={<Blocks />} />
          <Route path="units" element={<Units />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="leases" element={<Leases />} />
          <Route path="transactions"
            element={<Transactions />} />
          <Route path="maintenance"
            element={<Maintenance />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App