import { NavLink, Outlet } from 'react-router-dom'
import { CompareTray } from '../features/compare/CompareTray'
import { useCompare } from '../features/compare/useCompare'
import { useAuth } from '../features/auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import { Tools } from './Tools'

/** Cornice dell'app: barra superiore su una sola riga, contenuto e vassoio del confronto. */
export function Shell() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const { entries } = useCompare()

  return (
    <div className="shell">
      <a className="skip" href="#content">
        {t('app.skip')}
      </a>
      <header className="topbar">
        <NavLink to="/" className="wordmark" aria-label={t('app.name')}>
          Scout<span>AI</span>
        </NavLink>

        <nav className="topbar__nav" aria-label={t('nav.main')}>
          <NavLink to="/" end>
            {t('nav.search')}
          </NavLink>
          <NavLink to="/confronto">
            {t('nav.compare')}
            {entries.length > 0 && <span className="count">{entries.length}</span>}
          </NavLink>
          <NavLink to="/metodo">{t('nav.method')}</NavLink>
        </nav>

        <div className="topbar__tools">
          <Tools />
          {user ? (
            <>
              <span className="topbar__user">{user.displayName}</span>
              <button type="button" className="btn" onClick={() => void logout()}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <NavLink to="/accesso" className="btn btn--primary">
              {t('nav.login')}
            </NavLink>
          )}
        </div>
      </header>

      <main id="content" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <CompareTray />
    </div>
  )
}
