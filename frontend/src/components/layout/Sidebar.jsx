import { useState } from 'react'
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

const Sidebar = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0
        right-0 z-50 bg-gray-900 px-4 py-3
        flex items-center justify-between">
        <h1 className="text-white font-bold text-base">
          🏘️ Property Manager
        </h1>
        <button
          onClick={() => setOpen(!open)}
          className="text-white text-2xl
            focus:outline-none"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0
            bg-black bg-opacity-50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 flex flex-col
        transform transition-transform duration-200
        ${open
          ? 'translate-x-0'
          : '-translate-x-full lg:translate-x-0'
        }
      `}>
        {/* Logo — desktop only */}
        <div className="hidden lg:block p-6
          border-b border-gray-700">
          <h1 className="text-white font-bold
            text-lg leading-tight">
            🏘️ Property
            <br />
            <span className="text-indigo-400">
              Manager
            </span>
          </h1>
        </div>

        {/* Spacer for mobile header */}
        <div className="lg:hidden h-16" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1
          overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5
                rounded-lg text-sm font-medium
                transition-colors
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
          <p className="text-xs text-gray-500
            text-center">
            Rental Management v1.0
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar