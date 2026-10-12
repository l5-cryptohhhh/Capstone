import { Sparkle } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAiSearch } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { StateMessage } from '../../components/StateMessage'
import { useI18n } from '../../i18n/useI18n'
import { useAuth } from '../auth/useAuth'
import { aiChips } from './aiChips'
import { EMPTY_FILTERS } from './filters'
import { ResultsRegister } from './ResultsRegister'

const MAX_LENGTH = 300
const AI_FILTERS = { ...EMPTY_FILTERS, sort: 'rating' }

/** Ricerca in linguaggio naturale: l'AI produce i filtri, i giocatori vengono dal database. */
export function AiSearch() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const location = useLocation()
  const [text, setText] = useState('')
  const search = useAiSearch()

  if (!user) {
    return (
      <section className="ai-box" aria-label={t('ai.search.label')}>
        <p className="ai-box__guest">
          <Sparkle size={18} aria-hidden="true" /> {t('ai.search.guest')}{' '}
          <Link to="/accesso" state={{ from: `/${location.search}` }}>
            {t('ai.search.guest.cta')}
          </Link>
        </p>
      </section>
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const query = text.trim()
    if (query && !search.isPending) search.mutate(query)
  }

  const data = search.data
  const count = data?.results.totalElements ?? 0

  return (
    <section className="ai-box" aria-label={t('ai.search.label')}>
      <form className="ai-box__form" onSubmit={onSubmit}>
        <label className="ai-box__label" htmlFor="ai-query">
          <Sparkle size={16} aria-hidden="true" /> {t('ai.search.label')}
        </label>
        <div className="ai-box__row">
          <input
            id="ai-query"
            className="ai-box__input"
            type="text"
            value={text}
            maxLength={MAX_LENGTH}
            placeholder={t('ai.search.placeholder')}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={search.isPending || text.trim() === ''}>
            {search.isPending ? t('ai.search.busy') : t('ai.search.submit')}
          </button>
        </div>
        <p className="ai-box__note">{t('ai.search.note')}</p>
      </form>

      {search.isError && <ErrorState error={search.error} onRetry={() => search.mutate(text.trim())} />}

      {data && (
        <div className="ai-box__result" aria-live="polite">
          <div className="ai-box__understood">
            <span className="ai-box__understood-title">{t('ai.search.understood')}</span>
            <ul className="ai-chips">
              {aiChips(data.interpreted, t).map((chip) => (
                <li key={chip} className="ai-chip">
                  {chip}
                </li>
              ))}
            </ul>
            <button type="button" className="btn" onClick={() => search.reset()}>
              {t('ai.search.clear')}
            </button>
          </div>

          <h2 className="results__count">
            {t(count === 1 ? 'ai.search.count.one' : 'ai.search.count.other', {
              n: new Intl.NumberFormat(locale).format(count),
            })}
          </h2>

          {data.results.content.length === 0 ? (
            <StateMessage tone="empty" title={t('results.empty.title')}>
              {t('ai.search.empty')}
            </StateMessage>
          ) : (
            <ResultsRegister data={data.results} filters={AI_FILTERS} metricKeys={['rating']} busy={false} />
          )}
        </div>
      )}
    </section>
  )
}
