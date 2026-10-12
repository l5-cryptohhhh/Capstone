import { CheckCircle, LockSimple } from '@phosphor-icons/react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { useTheme } from '../../app/useTheme'
import { BrandMark, Wordmark } from '../../components/Brand'
import { LaserFlow } from '../../components/LaserFlow'
import { Tools } from '../../components/Tools'
import { useI18n } from '../../i18n/useI18n'
import type { TranslationKey } from '../../i18n/it'
import { markEntering } from './entry'
import { useAuth } from './useAuth'

type Mode = 'login' | 'register'

// three.js e il pallone 3D si scaricano solo nella pagina di accesso, dopo il resto
const BouncingBall = lazy(() => import('./BouncingBall'))

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
  const { theme } = useTheme()
  // Il fascio di luce cade sul bordo superiore del modulo: la sua posizione segue la card
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const [beam, setBeam] = useState(0.5)
  useLayoutEffect(() => {
    const stage = stageRef.current
    const card = cardRef.current
    if (!stage || !card) return
    const update = () => {
      const stageBox = stage.getBoundingClientRect()
      const cardBox = card.getBoundingClientRect()
      if (stageBox.width === 0) return
      // Su schermi stretti il logo sta sopra la card: il fascio scende vicino al bordo sinistro, fuori dal logo
      const narrow = window.matchMedia('(max-width: 959px)').matches
      setBeam((cardBox.left - stageBox.left + cardBox.width * (narrow ? 0.12 : 0.5)) / stageBox.width)
    }
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    observer.observe(card)
    return () => observer.disconnect()
  }, [])
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
  // Dopo l'accesso il pallone parte in spirale e riempie lo schermo: finché non ha finito si resta qui.
  const [ballReady, setBallReady] = useState(false)
  const [armed, setArmed] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [guestGo, setGuestGo] = useState(false) // "Continua senza accedere" ha prenotato il lancio
  const onBallReady = useCallback(() => setBallReady(true), [])
  const onLaunched = useCallback(() => setLaunched(true), [])
  const leaving = armed && (user !== null || guestGo)

  useEffect(() => {
    if (!leaving) return
    const fallback = window.setTimeout(() => setLaunched(true), 4000) // es. scheda in secondo piano: non si resta bloccati
    return () => window.clearTimeout(fallback)
  }, [leaving])
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  // Il visitatore entra alla fine del lancio, come chi accede
  useEffect(() => {
    if (guestGo && launched) {
      continueAsGuest()
      navigate('/')
    }
  }, [guestGo, launched, continueAsGuest, navigate])

  if (user && (!armed || launched)) return <Navigate to={from} replace />

  const isLogin = mode === 'login'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    markEntering(true)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setArmed(ballReady && !reduced) // si prenota il lancio prima della risposta, così l'accesso non ci scavalca
    try {
      if (isLogin) await login(email, password)
      else await register(email, displayName, password)
    } catch (e) {
      markEntering(false)
      setArmed(false)
      setError(messageKey(e))
      setBusy(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  return (
    <div className={leaving ? 'auth is-leaving' : 'auth'}>
      <div className="auth__laser" ref={stageRef} aria-hidden="true">
        <LaserFlow
          surfaceRef={cardRef}
          beamPosition={beam}
          color={theme === 'light' ? '#14803a' : '#39d353'}
          theme={theme}
          intensity={1.7}
          fog={0.2}
          dust={1.4}
          paused={leaving}
        />
      </div>

      <div className="auth__tools">
        <Tools />
      </div>

      <section className="auth__brand" aria-label={t('app.name')}>
        <p className="auth__logo">
          <BrandMark />
          <span>
            Scout{' '}
            <span className="wordmark__ai auth__ai">
              AI
              <Suspense fallback={null}>
                <BouncingBall launch={leaving} onReady={onBallReady} onLaunched={onLaunched} />
              </Suspense>
            </span>
          </span>
        </p>
        <p className="auth__slogan">{t('auth.brand.slogan')}</p>
        <ul className="auth__list">
          {(['auth.brand.f1', 'auth.brand.f2', 'auth.brand.f3', 'auth.brand.f4'] as const).map((key) => (
            <li key={key}>
              <CheckCircle size={20} aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <main className="auth__card" id="content" ref={cardRef}>
        <p className="wordmark">
          <Wordmark />
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
              markEntering(true)
              const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              if (ballReady && !reduced) {
                setArmed(true)
                setGuestGo(true)
              } else {
                continueAsGuest()
                navigate('/')
              }
            }}
          >
            {t('auth.guest')}
          </button>
          <p>
            <LockSimple size={14} aria-hidden="true" /> {t('auth.guest.note', { n: 3 })}
          </p>
        </div>
      </main>
    </div>
  )
}
