import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/expenses', label: 'Despesas', icon: '💰' },
  { to: '/categories', label: 'Categorias', icon: '🏷️' },
  { to: '/rules', label: 'Regras', icon: '⚙️' },
]

export function Layout() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-gray-50 dark:bg-gray-900">
      {/* Content area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* FAB — Add expense */}
      <button
        onClick={() => navigate('/expenses/new')}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg active:scale-95 active:shadow-md"
        aria-label="Adicionar despesa"
      >
        +
      </button>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
        <div className="mx-auto flex max-w-lg">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
