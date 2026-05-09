import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/',             label: 'Dashboard',    icon: '📊' },
  { path: '/blocks',       label: 'Blocks',       icon: '🏢' },
  { path: '/units',        label: 'Units',        icon: '🚪' },
  { path: '/tenants',      label: 'Tenants',      icon: '👥' },
  { path: '/leases',       label: 'Leases',       icon: '📋' },
  { path: '/transactions', label: 'Transactions', icon: '💰' },
  { path: '/maintenance',  label: 'Maintenance',  icon: '🔧' },
  { path: '/reports',      label: 'Reports',      icon: '📈' }
]

const Sidebar = () => (
  <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
    <div className="p-6 border-b border-gray-700">
      <h1 className="text-white font-bold text-lg leading-tight">
        🏘️ Property
        <br />
        <span className="text-indigo-400">Manager</span>
      </h1>
    </div>
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-2.5
            rounded-lg text-sm font-medium transition-colors
            ${isActive
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
          `}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
    <div className="p-4 border-t border-gray-700">
      <p className="text-xs text-gray-500 text-center">
        Rental Management v1.0
      </p>
    </div>
  </aside>
)

export default Sidebar