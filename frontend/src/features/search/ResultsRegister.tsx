import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import type { PageResponse, PlayerSummary } from '../../api/types'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { ScaleRow } from '../../components/ScaleRow'
import { useI18n } from '../../i18n/I18nProvider'
import type { TranslationKey } from '../../i18n/it'
import { countryName } from '../../lib/countries'
import { formatNumber } from '../../lib/format'
import { useCompare } from '../compare/CompareProvider'
import type { Filters } from './filters'

interface Props {
  data: PageResponse<PlayerSummary>
  filters: Filters
  metricKeys: string[]
  busy: boolean
  onSort: (sort: string) => void
  onPage: (page: number) => void
}

const BASE_COLUMNS: { sort: string; labelKey: TranslationKey; className: string }[] = [
  { sort: 'age', labelKey: 'results.col.age', className: 'num age' },
  { sort: '', labelKey: 'results.col.position', className: 'pos' },
  { sort: '', labelKey: 'results.col.team', className: 'team' },
  { sort: 'minutes', labelKey: 'results.col.minutes', className: 'num' },
  { sort: 'goals', labelKey: 'results.col.goals', className: 'num num--opt' },
  { sort: 'assists', labelKey: 'results.col.assists', className: 'num num--opt' },
]

export function ResultsRegister({ data, filters, metricKeys, busy, onSort, onPage }: Props) {
  const { t, metricLabel, locale, lang } = useI18n()
  const compare = useCompare()
  const location = useLocation()

  const ariaSort = (sort: string): 'ascending' | 'descending' | 'none' =>
    filters.sort === sort ? (filters.order === 'asc' ? 'ascending' : 'descending') : 'none'

  const sortButton = (sort: string, label: string, className?: string) => (
    <button
      type="button"
      className={`sort ${className ?? ''}`}
      onClick={() => onSort(sort)}
      aria-label={t('results.sort', { column: label })}
    >
      <span>{label}</span>
      {filters.sort === sort &&
        (filters.order === 'asc' ? (
          <CaretUp size={12} weight="bold" aria-hidden="true" />
        ) : (
          <CaretDown size={12} weight="bold" aria-hidden="true" />
        ))}
    </button>
  )

  const totalPages = Math.max(1, data.totalPages)

  return (
    <>
      <div className="register__scroll" aria-busy={busy}>
        <table className={busy ? 'register is-busy' : 'register'}>
          <thead>
            <tr>
              <th scope="col" className="check" />
              <th scope="col" aria-sort={ariaSort('name')} className="who">
                {sortButton('name', t('results.col.player'))}
              </th>
              {BASE_COLUMNS.map((column) => (
                <th
                  key={column.labelKey}
                  scope="col"
                  className={column.className}
                  aria-sort={column.sort ? ariaSort(column.sort) : undefined}
                >
                  {column.sort ? sortButton(column.sort, t(column.labelKey), 'sort--num') : t(column.labelKey)}
                </th>
              ))}
              {metricKeys.map((key) => (
                <th key={key} scope="col" className="metric" aria-sort={ariaSort(key)}>
                  {sortButton(key, metricLabel(key), 'sort--num')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.content.map((player) => {
              const selected = compare.has(player.id)
              const blocked = !selected && compare.isFull
              return (
                <tr key={`${player.id}-${player.team.id}`} className={selected ? 'is-selected' : undefined}>
                  <td className="check">
                    <label className="tick" title={blocked ? t('results.compare.full') : undefined}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={blocked}
                        onChange={() =>
                          selected
                            ? compare.remove(player.id)
                            : compare.add({ id: player.id, name: player.name, photoUrl: player.photoUrl })
                        }
                        aria-label={
                          selected
                            ? t('results.compare.remove', { name: player.name })
                            : t('results.compare.add', { name: player.name })
                        }
                      />
                      <svg className="box__x" viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">
                        <path d="M-5 -5 L5 5 M5 -5 L-5 5" />
                      </svg>
                    </label>
                  </td>
                  <th scope="row" className="who">
                    <Link
                      to={`/giocatore/${player.id}?season=${player.season}`}
                      className="who__link"
                      state={{ search: location.search }}
                    >
                      <PlayerPhoto name={player.name} url={player.photoUrl} size="sm" />
                      <span className="who__text">
                        <span className="who__name">{player.name}</span>
                        <span className="who__sub">{countryName(player.nationality, lang) ?? ''}</span>
                      </span>
                    </Link>
                  </th>
                  <td className="num age">{formatNumber(player.age, locale)}</td>
                  <td className="pos">{player.position ? t(`position.${player.position}.short`) : '-'}</td>
                  <td className="team">{player.team.name}</td>
                  <td className="num" data-label={t('results.col.minutes')}>
                    {formatNumber(player.minutes, locale)}
                  </td>
                  <td className="num num--opt">{formatNumber(player.goals, locale)}</td>
                  <td className="num num--opt">{formatNumber(player.assists, locale)}</td>
                  {metricKeys.map((key) => {
                    const m = player.metrics[key]
                    const label = metricLabel(key)
                    return (
                      <td key={key} className="metric" data-label={label}>
                        {m ? (
                          <>
                            <span className="metric__value">{formatNumber(m.value, locale, 2)}</span>
                            {m.percentile === null ? (
                              <span className="chip-stamp" title={t('player.stamp.title')}>
                                {t('player.stamp.metric')}
                              </span>
                            ) : (
                              <>
                                <ScaleRow
                                  compact
                                  label={label}
                                  marks={[{ id: key, percentile: m.percentile, color: 'var(--mark-1)', shape: 'x' }]}
                                />
                                <span className="metric__pct">{t('results.metric.pct', { value: m.percentile })}</span>
                              </>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <nav className="pager" aria-label={t('results.pager')}>
        <button type="button" className="btn" disabled={data.page <= 0} onClick={() => onPage(data.page - 1)}>
          {t('results.prev')}
        </button>
        <span className="pager__info">{t('results.page', { page: data.page + 1, total: totalPages })}</span>
        <button
          type="button"
          className="btn"
          disabled={data.page + 1 >= totalPages}
          onClick={() => onPage(data.page + 1)}
        >
          {t('results.next')}
        </button>
      </nav>
    </>
  )
}
