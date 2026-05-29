import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { brandLogo } from '../../brand'
import { useAuth } from '../../contexts/AuthContext'
import './Login.css'

export function Login() {
  const { user, loading, signInGoogle, signInEmail } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInEmail(email.trim(), password)
    } catch {
      setError('No se pudo iniciar sesión. Revisa tu correo y contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setSubmitting(true)
    try {
      await signInGoogle()
    } catch {
      setError('No se pudo iniciar sesión con Google.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand">
        <img className="login-brand__logo" src={brandLogo} alt="Tijuana Sin Barreras" />
        <p className="login-brand__tagline">Tijuana sin barreras</p>
      </aside>

      <div className="login-form-side">
        <div className="login-card">
          <header className="login-card__header">
            <h1>Acceso funcionarios</h1>
            <p className="login-card__subtitle">
              Inicia sesión para consultar métricas, mapas y reportes.
            </p>
          </header>

          {error && (
            <p className="login-card__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="login-card__google"
            disabled={submitting || loading}
            onClick={() => void handleGoogleSignIn()}
          >
            <svg className="login-card__google-icon" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            Continuar con Google
          </button>

        <div className="login-card__divider">
          <span>o</span>
        </div>

        <form className="login-card__form" onSubmit={(e) => void handleEmailSubmit(e)}>
          <label>
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || loading}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || loading}
            />
          </label>
          <button type="submit" className="login-card__submit" disabled={submitting || loading}>
            {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
          </form>
        </div>
      </div>
    </div>
  )
}
