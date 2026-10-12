import type { TranslationKey } from '../../i18n/it'
import { useI18n } from '../../i18n/useI18n'
import { MIN_MINUTES_FOR_PERCENTILES } from '../player/helpers'
import type { Filters } from './filters'

interface Option {
  id: string
  sort: string
  order: 'asc' | 'desc'
  labelKey: TranslationKey
}

/** Gli ordini proposti sopra la lista; il primo è quello di partenza (DEFAULT_SORT, decrescente). */
const SORT_OPTIONS: Option[] = [
  { id: 'best', sort: 'rating', order: 'desc', labelKey: 'sortbar.best' },
  { id: 'worst', sort: 'rating', order: 'asc', labelKey: 'sortbar.worst' },
  { id: 'alpha', sort: 'name', order: 'asc', labelKey: 'sortbar.alpha' },
]

interface Props {
  filters: Pick<Filters, 'sort' | 'order' | 'minMinutes'>
  onChange: (sort: string, order: 'asc' | 'desc') => void
}

/**
 * Ordine della lista, sopra i risultati (i filtri restano nel pannello a sinistra).
 * Se l'utente ordina dalle intestazioni della tabella nessuna voce risulta attiva, e la tabella mostra la freccia.
 */
export function SortBar({ filters, onChange }: Props) {
  const { t } = useI18n()
  const showMinutesNote = filters.sort === 'rating' && filters.minMinutes === undefined

  return (
    <div className="sortbar">
      <span className="sortbar__label" id="sortbar-label">
        {t('sortbar.label')}
      </span>
      <div className="seg" role="group" aria-labelledby="sortbar-label">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="seg__btn"
            aria-pressed={filters.sort === option.sort && filters.order === option.order}
            onClick={() => onChange(option.sort, option.order)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      {showMinutesNote && (
        <p className="sortbar__note">{t('sortbar.note', { min: MIN_MINUTES_FOR_PERCENTILES })}</p>
      )}
    </div>
  )
}
