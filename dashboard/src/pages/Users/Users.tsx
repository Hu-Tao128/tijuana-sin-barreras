import { useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../contexts/ProfileContext'
import '../../App.css'

export function Configuracion() {
  const { user, signOut } = useAuth()
  const { photoUrl, setPhoto } = useProfile()
  const [language, setLanguage] = useState('es')
  const [darkMode, setDarkMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="dashboard-grid">
      <article className="dashboard-card">
        <h2>Cuenta</h2>
        <p className="metric-meta">Datos básicos de la sesión.</p>

        <div className="profile-photo">
          {photoUrl ? (
            <img className="profile-photo__img" src={photoUrl} alt="Foto de perfil" />
          ) : (
            <span className="profile-photo__placeholder" aria-hidden="true">
              {user?.displayName?.charAt(0).toUpperCase() ?? 'F'}
            </span>
          )}
          <div className="profile-photo__actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              className="secondary-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Seleccionar foto
            </button>
            {photoUrl && (
              <button type="button" className="link-btn" onClick={() => setPhoto(null)}>
                Quitar foto
              </button>
            )}
          </div>
        </div>

        <div className="settings-row">
          <p>
            <strong>Nombre:</strong> {user?.displayName ?? 'Funcionario Público'}
          </p>
          <p>
            <strong>Correo:</strong> {user?.email ?? 'Sin correo disponible'}
          </p>
        </div>
        <button type="button" className="danger-btn" onClick={() => void signOut()}>
          Cerrar sesión
        </button>
      </article>

      <article className="dashboard-card">
        <h2>Preferencias</h2>
        <p className="metric-meta">Estas opciones aún no son funcionales.</p>

        <div className="setting-item">
          <div>
            <p className="setting-item__label">Idioma</p>
            <p className="setting-item__hint">Idioma de la interfaz</p>
          </div>
          <select
            className="setting-item__select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <p className="setting-item__label">Modo oscuro</p>
            <p className="setting-item__hint">Cambiar a tema oscuro</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            className={`toggle${darkMode ? ' is-on' : ''}`}
            onClick={() => setDarkMode((prev) => !prev)}
          >
            <span className="toggle__thumb" />
          </button>
        </div>
      </article>
    </div>
  )
}
