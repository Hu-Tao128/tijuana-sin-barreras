import { useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAppSettings } from '../../contexts/AppSettingsContext'
import { useProfile } from '../../contexts/ProfileContext'
import '../../App.css'

export function Configuracion() {
  const { user, signOut } = useAuth()
  const { photoUrl, setPhoto } = useProfile()
  const { language, setLanguage, darkMode, setDarkMode, t } = useAppSettings()
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
        <h2>{t('settings.account')}</h2>
        <p className="metric-meta">{t('settings.accountMeta')}</p>

        <div className="profile-photo">
          {photoUrl ? (
            <img className="profile-photo__img" src={photoUrl} alt={t('profilePhoto')} />
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
              {t('settings.selectPhoto')}
            </button>
            {photoUrl && (
              <button type="button" className="link-btn" onClick={() => setPhoto(null)}>
                {t('settings.removePhoto')}
              </button>
            )}
          </div>
        </div>

        <div className="settings-row">
          <p>
            <strong>{t('settings.name')}:</strong>{' '}
            {user?.displayName ?? t('settings.publicOfficial')}
          </p>
          <p>
            <strong>{t('settings.email')}:</strong> {user?.email ?? t('settings.noEmail')}
          </p>
        </div>
        <button type="button" className="danger-btn" onClick={() => void signOut()}>
          {t('settings.signOut')}
        </button>
      </article>

      <article className="dashboard-card">
        <h2>{t('settings.preferences')}</h2>
        <p className="metric-meta">{t('settings.preferencesMeta')}</p>

        <div className="setting-item">
          <div>
            <p className="setting-item__label">{t('settings.language')}</p>
            <p className="setting-item__hint">{t('settings.languageHint')}</p>
          </div>
          <select
            className="setting-item__select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="setting-item">
          <div>
            <p className="setting-item__label">{t('settings.darkMode')}</p>
            <p className="setting-item__hint">{t('settings.darkModeHint')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            className={`toggle${darkMode ? ' is-on' : ''}`}
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="toggle__thumb" />
          </button>
        </div>
      </article>
    </div>
  )
}
