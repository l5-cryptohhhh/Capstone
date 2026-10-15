import { Camera, SignOut, Trash } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { apiSend, apiUpload } from '../../api/client'
import { useTheme } from '../../app/useTheme'
import { Avatar } from '../../components/Avatar'
import { useI18n } from '../../i18n/useI18n'
import { errorKey } from '../../lib/errors'
import { formatDate } from '../../lib/format'
import { useAuth, type User } from '../auth/useAuth'
import { FormNotice, type Notice } from './FormNotice'
import { SecuritySection } from './SecuritySection'
import {
  AVATAR_SOURCE_MAX_BYTES,
  AVATAR_TYPES,
  prepareAvatar,
} from './helpers'

const POSITIONS = ['GK', 'DEF', 'MID', 'ATT'] as const

export function ProfilePage() {
  const { t, lang, setLang, locale } = useI18n()
  const { theme, toggle } = useTheme()
  const { user, updateUser, logout } = useAuth()
  if (!user) return null

  return (
    <div className="page profile">
      <h1 className="page__title">{t('profile.title')}</h1>

      <Header user={user} onChange={updateUser} onLogout={() => void logout()} />

      <section className="part" aria-labelledby="pf-personal">
        <h2 id="pf-personal" className="part__title">
          {t('profile.personal')}
        </h2>
        <PersonalForm key={user.id} user={user} onSaved={updateUser} />
      </section>

      <SecuritySection user={user} onUserChange={updateUser} />

      <section className="part" aria-labelledby="pf-prefs">
        <h2 id="pf-prefs" className="part__title">
          {t('profile.prefs')}
        </h2>
        <div className="profile__prefs">
          <div className="profile__pref">
            <span className="profile__label">{t('profile.prefs.language')}</span>
            <div className="seg" role="group" aria-label={t('nav.language')}>
              {(['it', 'en'] as const).map((code) => (
                <button key={code} type="button" className="seg__btn" aria-pressed={lang === code} onClick={() => setLang(code)}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="profile__pref">
            <span className="profile__label">{t('profile.prefs.theme')}</span>
            <div className="seg" role="group" aria-label={t('profile.prefs.theme')}>
              {(['dark', 'light'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="seg__btn"
                  aria-pressed={theme === mode}
                  onClick={() => theme !== mode && toggle()}
                >
                  {mode === 'dark' ? t('profile.prefs.themeDark') : t('profile.prefs.themeLight')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="note">{user.createdAt ? t('profile.member', { date: formatDate(user.createdAt, locale) ?? '' }) : ''}</p>
      </section>
    </div>
  )
}

function Header({ user, onChange, onLogout }: { user: User; onChange: (user: User) => void; onLogout: () => void }) {
  const { t, locale } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<Notice>(null)

  const upload = useMutation({
    mutationFn: async (file: File) => apiUpload<User>('/auth/me/avatar', await prepareAvatar(file)),
    onSuccess: (next) => {
      onChange(next)
      setNotice({ tone: 'ok', text: t('profile.photo.saved') })
    },
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })
  const remove = useMutation({
    mutationFn: () => apiSend<User>('DELETE', '/auth/me/avatar'),
    onSuccess: (next) => {
      onChange(next)
      setNotice({ tone: 'ok', text: t('profile.photo.removed') })
    },
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) return setNotice({ tone: 'error', text: t('profile.photo.error.type') })
    if (file.size > AVATAR_SOURCE_MAX_BYTES) return setNotice({ tone: 'error', text: t('profile.photo.error.size') })
    setNotice(null)
    upload.mutate(file, {
      onError: () => setNotice({ tone: 'error', text: t('profile.photo.error.process') }),
    })
  }

  const busy = upload.isPending || remove.isPending

  return (
    <section className="profile__head" aria-label={user.displayName}>
      <Avatar name={user.displayName} url={user.avatarUrl} size="xl" />
      <div className="profile__who">
        <p className="profile__name">{user.displayName}</p>
        <p className="profile__email">{user.email}</p>
        {user.createdAt && (
          <p className="profile__since">{t('profile.member', { date: formatDate(user.createdAt, locale) ?? '' })}</p>
        )}
        <div className="profile__photo-actions">
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="profile__file"
            aria-label={t('profile.photo.change')}
            onChange={(e) => {
              pick(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button type="button" className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Camera size={16} aria-hidden="true" />
            {upload.isPending ? t('profile.saving') : t('profile.photo.change')}
          </button>
          {user.avatarUrl && (
            <button type="button" className="btn btn--quiet" disabled={busy} onClick={() => remove.mutate()}>
              <Trash size={16} aria-hidden="true" />
              {t('profile.photo.remove')}
            </button>
          )}
          <button type="button" className="btn btn--quiet profile__logout" onClick={onLogout}>
            <SignOut size={16} aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
        <p className="note">{t('profile.photo.hint')}</p>
        <FormNotice notice={notice} />
      </div>
    </section>
  )
}

function PersonalForm({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const { t } = useI18n()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio ?? '')
  const [location, setLocation] = useState(user.location ?? '')
  const [favoriteTeam, setFavoriteTeam] = useState(user.favoriteTeam ?? '')
  const [favoritePosition, setFavoritePosition] = useState<string>(user.favoritePosition ?? '')
  const [notice, setNotice] = useState<Notice>(null)

  const save = useMutation({
    mutationFn: () =>
      apiSend<User>('PATCH', '/auth/me', {
        displayName,
        bio,
        location,
        favoriteTeam,
        favoritePosition: favoritePosition || null,
      }),
    onSuccess: (next) => {
      onSaved(next)
      setNotice({ tone: 'ok', text: t('profile.saved') })
    },
    onError: (error) => setNotice({ tone: 'error', text: t(errorKey(error)) }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setNotice(null)
    save.mutate()
  }

  const dirty =
    displayName !== user.displayName ||
    bio !== (user.bio ?? '') ||
    location !== (user.location ?? '') ||
    favoriteTeam !== (user.favoriteTeam ?? '') ||
    favoritePosition !== (user.favoritePosition ?? '')

  return (
    <form className="profile__form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="pf-name">{t('profile.name')}</label>
        <input id="pf-name" className="input" value={displayName} maxLength={80} required onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="field profile__wide">
        <label htmlFor="pf-bio">{t('profile.bio')}</label>
        <textarea id="pf-bio" className="input profile__textarea" rows={3} maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} />
        <span className="profile__counter">{t('profile.bio.hint', { n: bio.length })}</span>
      </div>
      <div className="field">
        <label htmlFor="pf-location">{t('profile.location')}</label>
        <input id="pf-location" className="input" value={location} maxLength={80} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pf-team">{t('profile.team')}</label>
        <input id="pf-team" className="input" value={favoriteTeam} maxLength={80} onChange={(e) => setFavoriteTeam(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="pf-position">{t('profile.position')}</label>
        <select id="pf-position" className="input" value={favoritePosition} onChange={(e) => setFavoritePosition(e.target.value)}>
          <option value="">{t('profile.position.none')}</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {t(`position.${p}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="profile__actions profile__wide">
        <button type="submit" className="btn btn--primary" disabled={!dirty || save.isPending || displayName.trim() === ''}>
          {save.isPending ? t('profile.saving') : t('profile.save')}
        </button>
        <FormNotice notice={notice} />
      </div>
    </form>
  )
}
