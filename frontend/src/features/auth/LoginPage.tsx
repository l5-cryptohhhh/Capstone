import { LockSimple } from '@phosphor-icons/react'
import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { Tools } from '../../components/Tools'
import { useI18n } from '../../i18n/useI18n'
import type { TranslationKey } from '../../i18n/it'
import { useAuth } from './useAuth'

type Mode = 'login' | 'register'

function messageKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    if (error.code === 'UNAUTHORIZED') return 'auth.error.credentials'
    if (error.code === 'EMAIL_ALREADY_REGISTERED') return 'auth.error.emailTaken'
    if (error.code === 'INVALID_REQUEST') return 'auth.error.invalid'
    if (error.code === 'NETWORK') return 'error.NETWORK'
  }
  return 'error.UNKNOWN'
}

/** Accesso e registrazione: è la prima pagina per chi non ha ancora una sessione. */
export function LoginPage() {
  const { t } = useI18n()
  const { user, login, register, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const uid = useId()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<TranslationKey | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (user) return <Navigate to={from} replace />

  const isLogin = mode === 'login'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isLogin) await login(email, password)
      else await register(email, displayName, password)
    } catch (e) {
      setError(messageKey(e))
      setBusy(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  return (
    <div className="auth">
      <div className="auth__tools">
        <Tools />
      </div>

      <main className="auth__card" id="content">
        <p className="wordmark">
          Scout<span>AI</span>
        </p>
        <h1 className="auth__title">{t(isLogin ? 'auth.title.login' : 'auth.title.register')}</h1>
        <p className="auth__lead">{t('auth.tagline')}</p>

        <div className="seg auth__tabs" role="group" aria-label={t('auth.mode')}>
          <button type="button" className="seg__btn" aria-pressed={isLogin} onClick={() => switchMode('login')}>
            {t('auth.tab.login')}
          </button>
          <button type="button" className="seg__btn" aria-pressed={!isLogin} onClick={() => switchMode('register')}>
            {t('auth.tab.register')}
          </button>
        </div>

        <form onSubmit={submit}>
          {!isLogin && (
            <div className="field">
              <label htmlFor={`${uid}-name`}>{t('auth.name')}</label>
              <input
                id={`${uid}-name`}
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor={`${uid}-email`}>{t('auth.email')}</label>
            <input
              id={`${uid}-email`}
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-password`}>{t('auth.password')}</label>
            <input
              id={`${uid}-password`}
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? undefined : 8}
              maxLength={72}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              aria-describedby={isLogin ? undefined : `${uid}-hint`}
            />
            {!isLogin && (
              <p id={`${uid}-hint`} className="auth__hint">
                {t('auth.password.hint')}
              </p>
            )}
          </div>

          {error && (
            <p className="auth__error" role="alert">
              {t(error)}
            </p>
          )}

          <button type="submit" className="btn btn--primary auth__submit" disabled={busy}>
            {busy ? t('auth.busy') : t(isLogin ? 'auth.submit.login' : 'auth.submit.register')}
          </button>
        </form>

        <div className="auth__guest">
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              continueAsGuest()
              navigate('/')
            }}
          >
            {t('auth.guest')}
          </button>
          <p>
            <LockSimple size={14} weight="bold" aria-hidden="true" /> {t('auth.guest.note', { n: 3 })}
          </p>
        </div>
      </main>
    </div>
  )
}
