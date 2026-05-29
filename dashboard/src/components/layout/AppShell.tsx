import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  LayoutDashboard,
  Map as MapIcon,
  Route as RouteIcon,
  Settings,
  ClipboardList,
  X,
} from 'lucide-react'
import { brandLogo } from '../../brand'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../contexts/ProfileContext'
import './AppShell.css'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/mapa', label: 'Mapa', icon: MapIcon, end: false },
  { to: '/rutas', label: 'Rutas', icon: RouteIcon, end: false },
  { to: '/reportes', label: 'Reportes', icon: ClipboardList, end: false },
] as const

const SETTINGS_ITEM = { to: '/configuracion', label: 'Configuración' } as const

export function AppShell() {
  const { user } = useAuth()
  const { photoUrl } = useProfile()
  const location = useLocation()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'Hay 3 reportes pendientes de revisión manual.', unread: true },
    { id: 'n2', text: 'Se detectó un pico de incidencias en Zona Centro.', unread: true },
    { id: 'n3', text: 'Exportación semanal disponible para descarga.', unread: false },
  ])

  function dismissNotification(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id))
  }

  function clearAllNotifications() {
    setNotifications([])
  }

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith(SETTINGS_ITEM.to)) {
      return SETTINGS_ITEM.label
    }
    const match = NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )
    return match?.label ?? 'Panel de Control'
  }, [location.pathname])

  const unreadCount = notifications.filter((item) => item.unread).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar" aria-label="Navegación principal">
        <div className="app-shell__brand">
          <img
            className="app-shell__brand-logo"
            src={brandLogo}
            alt="Tijuana Sin Barreras"
            width={48}
            height={48}
          />
          <div>
            <p className="app-shell__brand-title">Tijuana Sin Barreras</p>
            <p className="app-shell__brand-subtitle">Panel de Control</p>
          </div>
        </div>

        <nav className="app-shell__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
              }
            >
              <Icon className="app-shell__nav-icon" size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to={SETTINGS_ITEM.to}
          className={({ isActive }) =>
            `app-shell__nav-link app-shell__nav-link--settings${
              isActive ? ' app-shell__nav-link--active' : ''
            }`
          }
        >
          <Settings className="app-shell__nav-icon" size={18} aria-hidden="true" />
          {SETTINGS_ITEM.label}
        </NavLink>

        <footer className="app-shell__sidebar-footer">
          <p>Gobierno de Tijuana</p>
          <p>2026 - Hackfox</p>
        </footer>
      </aside>

      <div className="app-shell__content">
        <header className="app-shell__header">
          <h1>{pageTitle}</h1>
          <div className="app-shell__header-actions">
            <div className="app-shell__notifications" ref={notificationsRef}>
              <button
                type="button"
                className="app-shell__notification-btn"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-expanded={isNotificationsOpen}
                aria-label="Abrir notificaciones"
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="app-shell__notification-dot" aria-hidden="true" />
                )}
              </button>
              {isNotificationsOpen && (
                <div className="app-shell__notification-panel" role="dialog" aria-label="Notificaciones">
                  <div className="app-shell__notification-head">
                    <p className="app-shell__notification-title">Notificaciones</p>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="app-shell__notification-clear"
                        onClick={clearAllNotifications}
                      >
                        Limpiar todo
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="app-shell__notification-empty">No hay notificaciones.</p>
                  ) : (
                    <ul>
                      {notifications.map((item) => (
                        <li key={item.id} className={item.unread ? 'is-unread' : ''}>
                          <span>{item.text}</span>
                          <button
                            type="button"
                            className="app-shell__notification-dismiss"
                            aria-label="Eliminar notificación"
                            onClick={() => dismissNotification(item.id)}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="app-shell__profile" title={user?.email ?? undefined}>
              {photoUrl ? (
                <img className="app-shell__avatar-img" src={photoUrl} alt="Foto de perfil" />
              ) : (
                <span className="app-shell__avatar" aria-hidden="true">
                  {user?.displayName?.charAt(0).toUpperCase() ?? 'F'}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
