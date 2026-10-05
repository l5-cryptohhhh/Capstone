import { Moon, Sun } from '@phosphor-icons/react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../app/ThemeProvider'
import { CompareTray } from '../features/compare/CompareTray'
import { useCompare } from '../features/compare/CompareProvider'
import { useI18n } from '../i18n/I18nProvider'

/** Cornice dell'app: barra superiore su una sola riga, contenuto e vassoio del confronto. */
export function Shell() {
  const { t, lang, setLang } = useI18n()
  const { theme, toggle } = useTheme()
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
          <div className="seg" role="group" aria-label={t('nav.language')}>
            {(['it', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                className="seg__btn"
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === 'dark' ? t('nav.theme.dark') : t('nav.theme.light')}
          >
            {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main id="content" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <CompareTray />
    </div>
  )
}
