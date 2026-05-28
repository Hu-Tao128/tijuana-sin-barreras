import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './AppShell.css'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/mapa-calor', label: 'Mapa de calor', end: false },
  { to: '/reportes', label: 'Reportes', end: false },
] as const

export function AppShell() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar" aria-label="Navegación principal">
        <div className="app-shell__brand">
          <span className="app-shell__brand-mark" aria-hidden="true">
            TSB
          </span>
          <div>
            <p className="app-shell__brand-title">Tijuana Sin Barreras</p>
            <p className="app-shell__brand-subtitle">Panel gubernamental</p>
          </div>
        </div>

        <nav className="app-shell__nav">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__footer">
          {user && (
            <p className="app-shell__user" title={user.email ?? undefined}>
              {user.displayName ?? user.email ?? 'Funcionario'}
            </p>
          )}
          <button type="button" className="app-shell__sign-out" onClick={() => void signOut()}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-shell__content">
        <Outlet />
      </div>
    </div>
  )
}
