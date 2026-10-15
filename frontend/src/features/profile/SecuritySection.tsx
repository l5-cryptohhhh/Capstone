import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../../api/client'
import { useI18n } from '../../i18n/useI18n'
import { errorKey } from '../../lib/errors'
import { useAuth, type User } from '../auth/useAuth'
import { passwordStrength } from './helpers'
import { FormNotice, type Notice } from './FormNotice'

/** Email, password, sessioni ed eliminazione dell'account. Ogni modulo chiede la password attuale. */
export function SecuritySection({ user, onUserChange }: { user: User; onUserChange: (user: User) => void }) {
  const { t } = useI18n()
  return (
    <section className="part" aria-labelledby="pf-security">
      <h2 id="pf-security" className="part__title">
        {t('profile.security')}
      </h2>
      <div className="profile__cards">
        <EmailForm user={user} onChange={onUserChange} />
        <PasswordForm />
        <SessionsCard />
        <DangerCard />
      </div>
    </section>
  )
}

function EmailForm({ user, onChange }: { user: User; onChange: (user: User) => void }) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice>(null)

  const change = useMutation({
    mutationFn: () => apiPost<User>('/auth/me/email', { newEmail: email, currentPassword: password }),
    onSuccess: (next) => {
      onChange(next)
      setEmail('')
      setPassword('')
      setNotice({ tone: 'ok', text: t('profile.email.saved') })
    },
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setNotice(null)
    change.mutate()
  }

  return (
    <form className="profile__card" onSubmit={submit}>
      <h3 className="profile__card-title">{t('profile.email.title')}</h3>
      <p className="note">{user.email}</p>
      <div className="field">
        <label htmlFor="pf-email">{t('profile.email.new')}</label>
        <input id="pf-email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pf-email-pw">{t('profile.password.current')}</label>
        <input id="pf-email-pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" className="btn" disabled={change.isPending || !email || !password}>
        {change.isPending ? t('profile.saving') : t('profile.email.save')}
      </button>
      <FormNotice notice={notice} />
    </form>
  )
}

function PasswordForm() {
  const { t } = useI18n()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const strength = passwordStrength(next)
  const mismatch = again.length > 0 && again !== next

  const change = useMutation({
    mutationFn: () => apiPost<void>('/auth/me/password', { currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setAgain('')
      setNotice({ tone: 'ok', text: t('profile.password.saved') })
    },
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setNotice(null)
    change.mutate()
  }

  return (
    <form className="profile__card" onSubmit={submit}>
      <h3 className="profile__card-title">{t('profile.password.title')}</h3>
      <div className="field">
        <label htmlFor="pf-pw-current">{t('profile.password.current')}</label>
        <input id="pf-pw-current" className="input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pf-pw-new">{t('profile.password.new')}</label>
        <input id="pf-pw-new" className="input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={next} onChange={(e) => setNext(e.target.value)} />
        {next.length > 0 && (
          <div className="strength" aria-live="polite">
            <span className="strength__bar" aria-hidden="true">
              {[1, 2, 3, 4].map((step) => (
                <span key={step} className={step <= strength ? `strength__seg is-on is-${strength}` : 'strength__seg'} />
              ))}
            </span>
            <span className="strength__label">{t(`profile.strength.${strength}`)}</span>
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="pf-pw-again">{t('profile.password.confirm')}</label>
        <input id="pf-pw-again" className="input" type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} aria-invalid={mismatch} />
        {mismatch && <span className="profile__notice profile__notice--error">{t('profile.password.mismatch')}</span>}
      </div>
      <button type="submit" className="btn" disabled={change.isPending || !current || next.length < 8 || next !== again}>
        {change.isPending ? t('profile.saving') : t('profile.password.save')}
      </button>
      <FormNotice notice={notice} />
    </form>
  )
}

function SessionsCard() {
  const { t } = useI18n()
  const [notice, setNotice] = useState<Notice>(null)
  const revoke = useMutation({
    mutationFn: () => apiPost<{ revoked: number }>('/auth/me/sessions/revoke-others'),
    onSuccess: (data) => setNotice({ tone: 'ok', text: t('profile.sessions.done', { n: data.revoked }) }),
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })

  return (
    <div className="profile__card">
      <h3 className="profile__card-title">{t('profile.sessions.title')}</h3>
      <p className="note">{t('profile.sessions.body')}</p>
      <button type="button" className="btn" disabled={revoke.isPending} onClick={() => revoke.mutate()}>
        {t('profile.sessions.revoke')}
      </button>
      <FormNotice notice={notice} />
    </div>
  )
}

function DangerCard() {
  const { t } = useI18n()
  const { closeAccount } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice>(null)

  const remove = useMutation({
    mutationFn: () => apiPost<void>('/auth/me/delete', { password }),
    onSuccess: () => {
      closeAccount()
      navigate('/accesso', { replace: true })
    },
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setNotice(null)
    remove.mutate()
  }

  return (
    <form className="profile__card profile__card--danger" onSubmit={submit}>
      <h3 className="profile__card-title">{t('profile.danger')}</h3>
      <p className="note">{t('profile.danger.body')}</p>
      {open ? (
        <>
          <div className="field">
            <label htmlFor="pf-del-pw">{t('profile.danger.confirm')}</label>
            <input id="pf-del-pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="profile__actions">
            <button type="submit" className="btn btn--danger" disabled={remove.isPending || !password}>
              {t('profile.danger.action')}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                setOpen(false)
                setPassword('')
                setNotice(null)
              }}
            >
              {t('profile.danger.cancel')}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="btn btn--danger" onClick={() => setOpen(true)}>
          {t('profile.danger.action')}
        </button>
      )}
      <FormNotice notice={notice} />
    </form>
  )
}
