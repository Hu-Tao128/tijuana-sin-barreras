import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
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
      <div className="login-card">
        <header className="login-card__header">
          <p className="login-card__eyebrow">Tijuana Sin Barreras</p>
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
  )
}
