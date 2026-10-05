import { X } from '@phosphor-icons/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMetrics, usePlayersByIds } from '../../api/queries'
import type { MetricValue, PlayerDetail, SeasonEntry } from '../../api/types'
import { ErrorState } from '../../components/ErrorState'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { MarkGlyph, ScaleRow } from '../../components/ScaleRow'
import { Stamp } from '../../components/Stamp'
import { StateMessage } from '../../components/StateMessage'
import { useI18n } from '../../i18n/useI18n'
import { countryName } from '../../lib/countries'
import { formatNumber, seasonLabel } from '../../lib/format'
import { METRIC_GROUPS } from '../../lib/metricGroups'
import { formatMetricValue } from '../player/helpers'
import { SLOTS, bestIndex, commonSeason, entryFor, parseIds } from './helpers'
import { useCompare } from './useCompare'

const BIO_ROWS = ['age', 'nationality', 'height', 'position', 'team', 'minutes'] as const

export function ComparePage() {
  const { t, metricLabel, locale, lang } = useI18n()
  const [params] = useSearchParams()
  const compare = useCompare()
  const navigate = useNavigate()
  const metricsInfo = useMetrics()

  const urlIds = parseIds(params.get('ids'))
  const ids = urlIds.length > 0 ? urlIds : compare.entries.map((e) => e.id)
  const queries = usePlayersByIds(ids)

  if (ids.length === 0) {
    return (
      <div className="page">
        <StateMessage
          tone="empty"
          title={t('compare.empty.title')}
          action={
            <Link to="/" className="btn">
              {t('error.back')}
            </Link>
          }
        >
          {t('compare.empty.body')}
        </StateMessage>
      </div>
    )
  }

  const failed = queries.find((q) => q.isError)
  if (failed) {
    return (
      <div className="page">
        <ErrorState error={failed.error} onRetry={() => queries.forEach((q) => q.refetch())} />
      </div>
    )
  }
  if (queries.some((q) => !q.data)) {
    return (
      <div className="page" aria-busy="true">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--block" />
      </div>
    )
  }

  const players = queries.map((q) => q.data as PlayerDetail)
  if (players.length < 2) {
    return (
      <div className="page">
        <StateMessage
          tone="empty"
          title={t('compare.one.title')}
          action={
            <Link to="/" className="btn">
              {t('error.back')}
            </Link>
          }
        >
          {t('compare.one.body')}
        </StateMessage>
      </div>
    )
  }

  const requestedSeason = Number(params.get('season'))
  const season = Number.isInteger(requestedSeason) && requestedSeason > 0 ? requestedSeason : commonSeason(players)
  const entries = players.map((p) => (season === undefined ? undefined : entryFor(p, season)))
  const metricInfo = new Map((metricsInfo.data ?? []).map((m) => [m.key, m]))
  const positions = new Set(entries.map((e) => e?.position).filter(Boolean))

  const metricOf = (entry: SeasonEntry | undefined, key: string): MetricValue | undefined =>
    entry?.metrics.find((m) => m.key === key)

  const bioValue = (row: (typeof BIO_ROWS)[number], player: PlayerDetail, entry?: SeasonEntry): string => {
    const unknown = '-'
    switch (row) {
      case 'age':
        return player.age !== null ? String(player.age) : unknown
      case 'nationality':
        return countryName(player.nationality, lang) ?? unknown
      case 'height':
        return player.heightCm !== null ? `${player.heightCm} cm` : unknown
      case 'position':
        return entry?.position ? t(`position.${entry.position}`) : unknown
      case 'team':
        return entry?.team.name ?? unknown
      case 'minutes':
        return formatNumber(entry?.stats.minutes, locale)
    }
  }

  const bioLabel = (row: (typeof BIO_ROWS)[number]): string =>
    ({
      age: t('player.bio.age'),
      nationality: t('player.bio.nationality'),
      height: t('player.bio.height'),
      position: t('player.bio.position'),
      team: t('player.bio.team'),
      minutes: t('stat.minutes'),
    })[row]

  let order = 0

  return (
    <div className="page page--wide" style={{ ['--n' as string]: players.length }}>
      <h1 className="page__title">{t('compare.title')}</h1>

      {season !== undefined && <p className="results__season">{t('compare.season')} {seasonLabel(season)}</p>}

      <div className="compare-heads">
        {players.map((player, i) => (
          <article key={player.id} className="compare-head">
            <div className="compare-head__top">
              <span className="compare-head__mark" aria-hidden="true">
                <MarkGlyph shape={SLOTS[i].shape} color={SLOTS[i].color} />
              </span>
              <PlayerPhoto name={player.name} url={player.photoUrl} size="md" />
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                aria-label={t('compare.remove', { name: player.name })}
                onClick={() => {
                  compare.remove(player.id)
                  const rest = ids.filter((id) => id !== player.id)
                  navigate(rest.length > 0 ? `/confronto?ids=${rest.join(',')}` : '/confronto', { replace: true })
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <h2 className="compare-head__name">
              <Link to={`/giocatore/${player.id}?season=${season ?? ''}`} aria-label={t('compare.open', { name: player.name })}>
                {player.name}
              </Link>
            </h2>
            <p className="compare-head__team">{entries[i]?.team.name ?? t('compare.missingSeason')}</p>
          </article>
        ))}
      </div>

      {positions.size > 1 && <Stamp title={t('compare.mixed.title')}>{t('compare.mixed')}</Stamp>}

      <section className="part" aria-labelledby="cmp-bio">
        <h2 id="cmp-bio" className="part__title">
          {t('compare.bio')}
        </h2>
        <table className="cmp-table">
          <thead>
            <tr>
              <td />
              {players.map((player, i) => (
                <th key={player.id} scope="col" className="cmp-colhead" title={player.name}>
                  <MarkGlyph shape={SLOTS[i].shape} color={SLOTS[i].color} />
                  <span>{player.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BIO_ROWS.map((row) => (
              <tr key={row}>
                <th scope="row">{bioLabel(row)}</th>
                {players.map((player, i) => (
                  <td key={player.id}>{bioValue(row, player, entries[i])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="part" aria-labelledby="cmp-profile">
        <h2 id="cmp-profile" className="part__title">
          {t('compare.profile')}
        </h2>
        <p className="note">{t('compare.profile.note')}</p>

        <div className="cmp-legend" aria-label={t('compare.legend')}>
          {players.map((player, i) => (
            <span key={player.id} className="cmp-legend__item">
              <MarkGlyph shape={SLOTS[i].shape} color={SLOTS[i].color} />
              {player.name}
            </span>
          ))}
        </div>

        <div className="cmp-colheads" aria-hidden="true">
          <span />
          <span />
          {players.map((player, i) => (
            <span key={player.id} className="cmp-colhead" title={player.name}>
              <MarkGlyph shape={SLOTS[i].shape} color={SLOTS[i].color} />
              <span>{player.name}</span>
            </span>
          ))}
        </div>

        {METRIC_GROUPS.map((group) => {
          const keys = group.metrics.filter((key) => entries.some((e) => metricOf(e, key)))
          if (keys.length === 0) return null
          return (
            <div key={group.id} className="group">
              <h3 className="group__title">{t(group.labelKey)}</h3>
              <ul className="metrics">
                {keys.map((key) => {
                  const label = metricLabel(key)
                  const higherIsBetter = metricInfo.get(key)?.higherIsBetter ?? true
                  const cells = entries.map((e) => metricOf(e, key))
                  const percentiles = cells.map((c) => c?.percentile ?? null)
                  const best =
                    bestIndex(percentiles, true) ?? bestIndex(cells.map((c) => c?.value ?? null), higherIsBetter)
                  const index = order++
                  return (
                    <li key={key} className="cmp-row">
                      <span className="metric-row__label">{label}</span>
                      <ScaleRow
                        label={label}
                        order={index}
                        marks={players.map((player, i) => ({
                          id: String(player.id),
                          percentile: percentiles[i],
                          color: SLOTS[i].color,
                          shape: SLOTS[i].shape,
                          owner: player.name,
                        }))}
                      />
                      {cells.map((cell, i) => (
                        <span
                          key={players[i].id}
                          className={best === i ? 'cmp-cell is-best' : 'cmp-cell'}
                          title={best === i ? t('compare.best') : undefined}
                        >
                          {cell ? (
                            <>
                              <span className="cmp-cell__value">{formatMetricValue(cell, locale)}</span>
                              <span className="cmp-cell__pct">
                                {cell.percentile === null ? t('player.stamp.metric') : `p${cell.percentile}`}
                              </span>
                            </>
                          ) : (
                            '-'
                          )}
                        </span>
                      ))}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </section>
    </div>
  )
}
