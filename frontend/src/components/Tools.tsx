import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '../app/useTheme'
import { useI18n } from '../i18n/useI18n'

/** Selettore di lingua e tema, comune alla barra dell'app e alla pagina di accesso. */
export function Tools() {
  const { t, lang, setLang } = useI18n()
  const { theme, toggle } = useTheme()

  return (
    <>
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
    </>
  )
}
