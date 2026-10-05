import { X } from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { useI18n } from '../../i18n/useI18n'
import { useCompare } from './useCompare'

/** Vassoio fisso in basso con i giocatori scelti per il confronto. */
export function CompareTray() {
  const { t } = useI18n()
  const { entries, remove, clear } = useCompare()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Nella pagina di confronto il vassoio sarebbe ridondante
  if (entries.length === 0 || pathname.startsWith('/confronto')) return null
  const ready = entries.length >= 2

  return (
    <aside className={pathname === '/' ? 'tray tray--aside' : 'tray'} aria-label={t('tray.title')}>
      <p className="tray__title">
        {t('tray.title')} <span className="tray__count">{t('tray.count', { n: entries.length })}</span>
      </p>
      <ul className="tray__list">
        {entries.map((entry) => (
          <li key={entry.id} className="tray__item">
            <PlayerPhoto name={entry.name} url={entry.photoUrl} size="sm" />
            <span className="tray__name">{entry.name}</span>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              onClick={() => remove(entry.id)}
              aria-label={t('tray.remove', { name: entry.name })}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="tray__actions">
        {!ready && <span className="tray__hint">{t('tray.needTwo')}</span>}
        <button type="button" className="btn btn--quiet" onClick={clear}>
          {t('tray.clear')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!ready}
          onClick={() => navigate(`/confronto?ids=${entries.map((e) => e.id).join(',')}`)}
        >
          {t('tray.open')}
        </button>
      </div>
    </aside>
  )
}
