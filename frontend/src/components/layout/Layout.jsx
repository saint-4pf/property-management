import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

const Layout = () => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <main className="flex-1 overflow-auto
      lg:ml-0 pt-16 lg:pt-0">
      <div className="p-4 lg:p-8">
        <Outlet />
      </div>
    </main>
  </div>
)

export default Layout