import { ArrowLeft, Plus, Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../../api/queries'
import type { MetricValue, PlayerDetail, SeasonEntry, StatLine } from '../../api/types'
import { ErrorState } from '../../components/ErrorState'
import { FieldGrid } from '../../components/FieldGrid'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { ScaleRow } from '../../components/ScaleRow'
import { Stamp } from '../../components/Stamp'
import { StateMessage } from '../../components/StateMessage'
import { useI18n } from '../../i18n/I18nProvider'
import type { TranslationKey } from '../../i18n/it'
import { countryName } from '../../lib/countries'
import { formatDate, formatNumber, seasonLabel } from '../../lib/format'
import { METRIC_GROUPS } from '../../lib/metricGroups'
import { useCompare } from '../compare/CompareProvider'
import { MIN_COHORT, MIN_MINUTES_FOR_PERCENTILES, formatMetricValue } from './helpers'

const STAT_ROWS: { key: keyof StatLine; labelKey: TranslationKey; decimals?: number }[] = [
  { key: 'appearances', labelKey: 'stat.appearances' },
  { key: 'lineups', labelKey: 'stat.lineups' },
  { key: 'minutes', labelKey: 'stat.minutes' },
  { key: 'rating', labelKey: 'stat.rating', decimals: 2 },
  { key: 'goals', labelKey: 'stat.goals' },
  { key: 'assists', labelKey: 'stat.assists' },
  { key: 'shotsTotal', labelKey: 'stat.shotsTotal' },
  { key: 'shotsOn', labelKey: 'stat.shotsOn' },
  { key: 'passesTotal', labelKey: 'stat.passesTotal' },
  { key: 'passesKey', labelKey: 'stat.passesKey' },
  { key: 'tacklesTotal', labelKey: 'stat.tacklesTotal' },
  { key: 'tacklesInterceptions', labelKey: 'stat.tacklesInterceptions' },
  { key: 'tacklesBlocks', labelKey: 'stat.tacklesBlocks' },
  { key: 'duelsTotal', labelKey: 'stat.duelsTotal' },
  { key: 'duelsWon', labelKey: 'stat.duelsWon' },
  { key: 'dribblesAttempts', labelKey: 'stat.dribblesAttempts' },
  { key: 'dribblesSuccess', labelKey: 'stat.dribblesSuccess' },
  { key: 'foulsDrawn', labelKey: 'stat.foulsDrawn' },
  { key: 'foulsCommitted', labelKey: 'stat.foulsCommitted' },
  { key: 'yellowCards', labelKey: 'stat.yellowCards' },
  { key: 'redCards', labelKey: 'stat.redCards' },
  { key: 'saves', labelKey: 'stat.saves' },
  { key: 'goalsConceded', labelKey: 'stat.goalsConceded' },
]

function Bio({ player, entry }: { player: PlayerDetail; entry: SeasonEntry }) {
  const { t, locale, lang } = useI18n()
  const unknown = t('player.bio.unknown')
  const items: [string, string][] = [
    [t('player.bio.age'), player.age !== null ? String(player.age) : unknown],
    [t('player.bio.born'), formatDate(player.birthDate, locale) ?? unknown],
    [t('player.bio.nationality'), countryName(player.nationality, lang) ?? unknown],
    [t('player.bio.height'), player.heightCm !== null ? `${player.heightCm} cm` : unknown],
    [t('player.bio.weight'), player.weightKg !== null ? `${player.weightKg} kg` : unknown],
    [t('player.bio.position'), entry.position ? t(`position.${entry.position}`) : unknown],
  ]
  return (
    <section className="part" aria-labelledby="bio-title">
      <h2 id="bio-title" className="part__title">
        {t('player.bio')}
      </h2>
      <FieldGrid items={items.map(([label, value]) => ({ label, value }))} colsDesktop={3} className="fields--bio" />
    </section>
  )
}

function Profile({ entry }: { entry: SeasonEntry }) {
  const { t, metricLabel, locale } = useI18n()
  const byKey = new Map(entry.metrics.map((m) => [m.key, m]))
  const hasPercentiles = entry.metrics.some((m) => m.percentile !== null)
  const cohort = entry.metrics.find((m) => m.cohortSize !== null)?.cohortSize ?? null
  const lowMinutes = (entry.stats.minutes ?? 0) < MIN_MINUTES_FOR_PERCENTILES
  let order = 0

  return (
    <section className="part" aria-labelledby="profile-title">
      <h2 id="profile-title" className="part__title">
        {t('player.profile')}
      </h2>

      {!hasPercentiles && (
        <Stamp title={t('player.stamp.title')}>
          {lowMinutes
            ? t('player.stamp.minutes', { min: MIN_MINUTES_FOR_PERCENTILES })
            : t('player.stamp.cohort', { n: MIN_COHORT })}
        </Stamp>
      )}

      {hasPercentiles && (
        <p className="note">
          {t('player.profile.note', {
            cohort: cohort ?? '',
            role: entry.position ? t(`position.${entry.position}.plural`) : t('player.profile.cohortUnknown'),
            min: MIN_MINUTES_FOR_PERCENTILES,
          })}
        </p>
      )}

      {METRIC_GROUPS.map((group) => {
        const rows = group.metrics.map((key) => byKey.get(key)).filter((m): m is MetricValue => m !== undefined)
        if (rows.length === 0) return null
        return (
          <div key={group.id} className="group">
            <h3 className="group__title">{t(group.labelKey)}</h3>
            <ul className="metrics">
              {rows.map((m) => {
                const label = metricLabel(m.key)
                const index = order++
                return (
                  <li key={m.key} className="metric-row">
                    <span className="metric-row__label">{label}</span>
                    <ScaleRow
                      label={label}
                      order={index}
                      marks={[{ id: m.key, percentile: m.percentile, color: 'var(--mark-1)', shape: 'x' }]}
                    />
                    <span className="metric-row__value">{formatMetricValue(m, locale)}</span>
                    <span className="metric-row__pct">
                      {m.percentile === null ? (
                        <span className="chip-stamp" title={t('player.stamp.title')}>
                          {t('player.stamp.metric')}
                        </span>
                      ) : (
                        `p${m.percentile}`
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

const CORE_STATS: (keyof StatLine)[] = ['minutes', 'appearances', 'rating', 'goals', 'assists']

function Stats({ entry }: { entry: SeasonEntry }) {
  const { t, locale } = useI18n()
  const rows = STAT_ROWS.filter((row) => entry.stats[row.key] !== null)
  const core = CORE_STATS.map((key) => rows.find((row) => row.key === key)).filter(
    (row): row is (typeof STAT_ROWS)[number] => row !== undefined,
  )
  const rest = rows.filter((row) => !CORE_STATS.includes(row.key))
  const toItem = (row: (typeof STAT_ROWS)[number]) => ({
    label: t(row.labelKey),
    value: formatNumber(entry.stats[row.key], locale, row.decimals ?? 0),
  })
  return (
    <section className="part" aria-labelledby="stats-title">
      <h2 id="stats-title" className="part__title">
        {t('player.stats')}
      </h2>
      <FieldGrid items={core.map(toItem)} colsDesktop={5} className="fields--core" />
      <FieldGrid items={rest.map(toItem)} colsDesktop={6} className="fields--stats" />
    </section>
  )
}

export function PlayerPage() {
  const { id } = useParams()
  const playerId = Number(id)
  const { t, locale } = useI18n()
  const [params] = useSearchParams()
  const [teamIndex, setTeamIndex] = useState(0)
  const compare = useCompare()
  const location = useLocation()
  const query = usePlayer(playerId)
  // torna alla ricerca con gli stessi filtri se si arriva da lì
  const backTo = `/${(location.state as { search?: string } | null)?.search ?? ''}`

  if (!Number.isInteger(playerId)) {
    return (
      <div className="page">
        <ErrorState error={new Error('invalid')} />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="page">
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
        <p>
          <Link to="/" className="btn">
            {t('error.back')}
          </Link>
        </p>
      </div>
    )
  }

  if (!query.data) {
    return (
      <div className="page" aria-busy="true">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--block" />
      </div>
    )
  }

  const player = query.data
  const seasons = [...new Set(player.seasons.map((s) => s.season))].sort((a, b) => b - a)
  const requested = Number(params.get('season'))
  const season = seasons.includes(requested) ? requested : seasons[0]
  const entries = player.seasons.filter((s) => s.season === season)
  const entry = entries[Math.min(teamIndex, Math.max(0, entries.length - 1))]
  const inCompare = compare.has(player.id)
  const syncedAt = formatDate(player.lastSyncedAt, locale)

  return (
    <div className="page">
      <Link to={backTo} className="back">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('player.back')}
      </Link>

      <header className="dossier-head">
        <PlayerPhoto name={player.name} url={player.photoUrl} size="lg" />
        <div className="dossier-head__text">
          <h1 className="dossier-head__name">{player.name}</h1>
          {entry && (
            <p className="dossier-head__line">
              {entry.team.name}
              <span className="dossier-head__sep" aria-hidden="true" />
              {entry.league.name}
              <span className="dossier-head__sep" aria-hidden="true" />
              {seasonLabel(entry.season)}
            </p>
          )}
        </div>
        <button
          type="button"
          className={inCompare ? 'btn btn--on' : 'btn'}
          aria-pressed={inCompare}
          disabled={!inCompare && compare.isFull}
          onClick={() =>
            inCompare ? compare.remove(player.id) : compare.add({ id: player.id, name: player.name, photoUrl: player.photoUrl })
          }
        >
          {inCompare ? <Check size={16} weight="bold" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {inCompare ? t('player.compare.remove') : t('player.compare.add')}
        </button>
      </header>

      {seasons.length > 1 && (
        <nav className="seg seg--wide" aria-label={t('player.season')}>
          {seasons.map((s) => (
            <Link
              key={s}
              to={`?season=${s}`}
              replace
              className="seg__btn"
              aria-current={s === season ? 'true' : undefined}
              onClick={() => setTeamIndex(0)}
            >
              {seasonLabel(s)}
            </Link>
          ))}
        </nav>
      )}

      {entries.length > 1 && (
        <div className="seg seg--wide" role="group" aria-label={t('player.bio.team')}>
          {entries.map((e, i) => (
            <button
              key={e.team.id}
              type="button"
              className="seg__btn"
              aria-pressed={i === teamIndex}
              onClick={() => setTeamIndex(i)}
            >
              {e.team.name}
            </button>
          ))}
        </div>
      )}

      {!entry ? (
        <StateMessage tone="empty" title={t('player.noSeason.title')}>
          {t('player.noSeason.body')}
        </StateMessage>
      ) : (
        <>
          <Bio player={player} entry={entry} />
          <Profile entry={entry} />
          <Stats entry={entry} />
          {syncedAt && <p className="source">{t('player.source', { date: syncedAt })}</p>}
        </>
      )}
    </div>
  )
}
