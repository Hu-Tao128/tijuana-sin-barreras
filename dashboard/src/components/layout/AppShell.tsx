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
import { useAppSettings } from '../../contexts/AppSettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../contexts/ProfileContext'
import './AppShell.css'

const NAV_PATHS = [
  { to: '/', key: 'nav.home', icon: LayoutDashboard, end: true },
  { to: '/mapa', key: 'nav.map', icon: MapIcon, end: false },
  { to: '/rutas', key: 'nav.routes', icon: RouteIcon, end: false },
  { to: '/reportes', key: 'nav.reports', icon: ClipboardList, end: false },
] as const

const SETTINGS_PATH = '/configuracion'

export function AppShell() {
  const { user } = useAuth()
  const { photoUrl } = useProfile()
  const { t } = useAppSettings()
  const location = useLocation()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState([
    { id: 'n1', textKey: 'notifications.n1', unread: true },
    { id: 'n2', textKey: 'notifications.n2', unread: true },
    { id: 'n3', textKey: 'notifications.n3', unread: false },
  ])

  function dismissNotification(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id))
  }

  function clearAllNotifications() {
    setNotifications([])
  }

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith(SETTINGS_PATH)) {
      return t('nav.settings')
    }
    const match = NAV_PATHS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )
    return match ? t(match.key) : t('brandSubtitle')
  }, [location.pathname, t])

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
            <p className="app-shell__brand-subtitle">{t('brandSubtitle')}</p>
          </div>
        </div>

        <nav className="app-shell__nav">
          {NAV_PATHS.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
              }
            >
              <Icon className="app-shell__nav-icon" size={18} aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to={SETTINGS_PATH}
          className={({ isActive }) =>
            `app-shell__nav-link app-shell__nav-link--settings${
              isActive ? ' app-shell__nav-link--active' : ''
            }`
          }
        >
          <Settings className="app-shell__nav-icon" size={18} aria-hidden="true" />
          {t('nav.settings')}
        </NavLink>

        <footer className="app-shell__sidebar-footer">
          <p>{t('footer.gov')}</p>
          <p>{t('footer.hackfox')}</p>
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
                aria-label={t('notifications.open')}
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="app-shell__notification-dot" aria-hidden="true" />
                )}
              </button>
              {isNotificationsOpen && (
                <div
                  className="app-shell__notification-panel"
                  role="dialog"
                  aria-label={t('notifications.title')}
                >
                  <div className="app-shell__notification-head">
                    <p className="app-shell__notification-title">{t('notifications.title')}</p>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="app-shell__notification-clear"
                        onClick={clearAllNotifications}
                      >
                        {t('notifications.clearAll')}
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="app-shell__notification-empty">{t('notifications.empty')}</p>
                  ) : (
                    <ul>
                      {notifications.map((item) => (
                        <li key={item.id} className={item.unread ? 'is-unread' : ''}>
                          <span>{t(item.textKey)}</span>
                          <button
                            type="button"
                            className="app-shell__notification-dismiss"
                            aria-label={t('notifications.dismiss')}
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
                <img className="app-shell__avatar-img" src={photoUrl} alt={t('profilePhoto')} />
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
