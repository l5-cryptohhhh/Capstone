import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLeagues, useMetrics, usePlayers } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { StateMessage } from '../../components/StateMessage'
import { useI18n } from '../../i18n/useI18n'
import { seasonLabel } from '../../lib/format'
import { FilterSheet } from './FilterSheet'
import { ResultsRegister } from './ResultsRegister'
import { EMPTY_FILTERS, activeFilterCount, parseFilters, serializeFilters, toApiParams, type Filters } from './filters'

function SkeletonRows() {
  return (
    <div className="register__scroll" aria-hidden="true">
      <table className="register">
        <tbody>
          {Array.from({ length: 10 }, (_, i) => (
            <tr key={i} className="skeleton-row">
              <td className="check" />
              <td className="who">
                <span className="skeleton skeleton--who" />
              </td>
              <td colSpan={7}>
                <span className="skeleton skeleton--line" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SearchPage() {
  const { t, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const filters = useMemo(() => parseFilters(params), [params])

  const leagues = useLeagues()
  const metrics = useMetrics()
  const players = usePlayers(useMemo(() => toApiParams(filters), [filters]))

  // Ogni modifica ai filtri riporta alla prima pagina, tranne il cambio pagina stesso.
  const onChange = useCallback(
    (patch: Partial<Filters>) => {
      setParams(
        (current) => {
          const next = { ...parseFilters(current), ...patch }
          if (!('page' in patch)) next.page = 0
          return serializeFilters(next)
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const onReset = useCallback(() => setParams(serializeFilters(EMPTY_FILTERS), { replace: true }), [setParams])

  const onSort = useCallback(
    (sort: string) =>
      onChange({
        sort,
        // primo clic: ordine più utile (decrescente, tranne nome ed età che partono crescenti)
        order: filters.sort === sort ? (filters.order === 'asc' ? 'desc' : 'asc') : sort === 'name' ? 'asc' : 'desc',
        page: 0,
      }),
    [filters.sort, filters.order, onChange],
  )

  const metricKeys = useMemo(() => {
    const keys = ['rating', ...filters.features.map((f) => f.metric).filter((k) => k !== 'rating')]
    if (!['name', 'age', 'minutes', 'rating', 'goals', 'assists'].includes(filters.sort) && !keys.includes(filters.sort)) {
      keys.push(filters.sort)
    }
    return keys
  }, [filters.features, filters.sort])

  const noDataAtAll = leagues.isSuccess && leagues.data.length === 0
  const count = players.data?.totalElements ?? 0
  const shownSeason = filters.season ?? players.data?.content[0]?.season
  const activeCount = activeFilterCount(filters)

  return (
    <div className="search">
      <button
        type="button"
        className="btn search__toggle"
        aria-expanded={sheetOpen}
        aria-controls="filter-sheet"
        onClick={() => setSheetOpen((open) => !open)}
      >
        {sheetOpen ? t('filters.close') : t('filters.open')}
        {activeCount > 0 && <span className="count">{activeCount}</span>}
      </button>

      <div id="filter-sheet" className={sheetOpen ? 'search__sheet is-open' : 'search__sheet'}>
        <FilterSheet
          filters={filters}
          leagues={leagues.data ?? []}
          metrics={metrics.data ?? []}
          onChange={onChange}
          onReset={onReset}
        />
      </div>

      <section className="search__results" aria-label={t('results.region')}>
        {noDataAtAll ? (
          <StateMessage tone="empty" title={t('results.nodata.title')}>
            {t('results.nodata.body')}
          </StateMessage>
        ) : players.isError && !players.data ? (
          <ErrorState error={players.error} onRetry={() => players.refetch()} />
        ) : !players.data ? (
          <SkeletonRows />
        ) : (
          <>
            <div className="results__head">
              <h1 className="results__count" aria-live="polite">
                {t(count === 1 ? 'results.count.one' : 'results.count.other', {
                  n: new Intl.NumberFormat(locale).format(count),
                })}
              </h1>
              {shownSeason !== undefined && (
                <p className="results__season">{t('results.season', { season: seasonLabel(shownSeason) })}</p>
              )}
            </div>

            {players.data.content.length === 0 ? (
              <StateMessage
                tone="empty"
                title={t('results.empty.title')}
                action={
                  activeCount > 0 && (
                    <button type="button" className="btn" onClick={onReset}>
                      {t('filters.reset')}
                    </button>
                  )
                }
              >
                {t('results.empty.body')}
              </StateMessage>
            ) : (
              <ResultsRegister
                data={players.data}
                filters={filters}
                metricKeys={metricKeys}
                busy={players.isFetching}
                onSort={onSort}
                onPage={(page) => onChange({ page })}
              />
            )}
            {players.isError && <ErrorState error={players.error} onRetry={() => players.refetch()} />}
          </>
        )}
      </section>
    </div>
  )
}
