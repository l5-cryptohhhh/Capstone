import { Plus, X } from '@phosphor-icons/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTeams } from '../../api/queries'
import type { LeagueWithSeasons, MetricInfo } from '../../api/types'
import { useI18n } from '../../i18n/I18nProvider'
import { seasonLabel } from '../../lib/format'
import { POSITIONS, activeFilterCount, type Filters } from './filters'

interface Props {
  filters: Filters
  leagues: LeagueWithSeasons[]
  metrics: MetricInfo[]
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined
}

/** Foglio di ricerca: i filtri sono sempre visibili e modificabili, e si applicano subito. */
export function FilterSheet({ filters, leagues, metrics, onChange, onReset }: Props) {
  const { t, metricLabel } = useI18n()
  const uid = useId()
  const [nameDraft, setNameDraft] = useState(filters.q)

  // Ultimo nome inviato ai filtri: distingue le nostre modifiche da quelle esterne (azzera, tasto indietro).
  const lastSent = useRef(filters.q)

  // Il nome si applica dopo una breve pausa di digitazione, per non interrogare l'API a ogni lettera.
  useEffect(() => {
    if (nameDraft === filters.q) return
    const timer = setTimeout(() => {
      lastSent.current = nameDraft
      onChange({ q: nameDraft })
    }, 300)
    return () => clearTimeout(timer)
  }, [nameDraft, filters.q, onChange])

  // Se l'URL cambia per un motivo esterno (filtri azzerati, tasto indietro) il campo lo segue;
  // se invece è l'eco di ciò che l'utente ha appena digitato, il testo in corso non si tocca.
  useEffect(() => {
    if (filters.q !== lastSent.current) {
      lastSent.current = filters.q
      setNameDraft(filters.q)
    }
  }, [filters.q])

  const seasons = useMemo(() => {
    const source = filters.leagueId ? leagues.filter((l) => l.id === filters.leagueId) : leagues
    return [...new Set(source.flatMap((l) => l.seasons))].sort((a, b) => b - a)
  }, [leagues, filters.leagueId])

  const teams = useTeams(filters.leagueId, filters.season)
  const available = metrics.filter((m) => !filters.position || m.positions.includes(filters.position))
  const unused = available.filter((m) => !filters.features.some((f) => f.metric === m.key))
  const activeCount = activeFilterCount(filters)

  const setFeature = (index: number, patch: Partial<Filters['features'][number]>) =>
    onChange({ features: filters.features.map((f, i) => (i === index ? { ...f, ...patch } : f)) })

  return (
    <form className="sheet" onSubmit={(e) => e.preventDefault()} aria-label={t('filters.title')}>
      <div className="sheet__head">
        <h2 className="sheet__title">{t('filters.title')}</h2>
        <button type="button" className="btn btn--quiet" onClick={onReset} disabled={activeCount === 0}>
          {t('filters.reset')}
        </button>
      </div>

      <div className="field">
        <label htmlFor={`${uid}-q`}>{t('filters.name')}</label>
        <input
          id={`${uid}-q`}
          type="search"
          className="input"
          value={nameDraft}
          maxLength={100}
          placeholder={t('filters.name.placeholder')}
          autoComplete="off"
          onChange={(e) => setNameDraft(e.target.value)}
        />
      </div>

      <fieldset className="field field--boxes">
        <legend>{t('filters.position')}</legend>
        <div className="boxes">
          {[undefined, ...POSITIONS].map((position) => {
            const checked = filters.position === position
            return (
              <label key={position ?? 'any'} className="box">
                <input
                  type="radio"
                  name={`${uid}-position`}
                  checked={checked}
                  onChange={() => onChange({ position })}
                />
                <svg className="box__x" viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">
                  <path d="M-5 -5 L5 5 M5 -5 L-5 5" />
                </svg>
                <span>{position ? t(`position.${position}`) : t('position.any')}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="field field--features">
        <legend>{t('filters.features')}</legend>
        <p className="hint">{t('filters.features.hint')}</p>

        {filters.features.length === 0 && <p className="hint hint--muted">{t('filters.features.none')}</p>}

        <ul className="features">
          {filters.features.map((feature, index) => (
            <li key={feature.metric} className="feature">
              <label className="feature__metric">
                <span className="visually-hidden">{t('filters.features.metric')}</span>
                <select
                  className="input"
                  value={feature.metric}
                  onChange={(e) => setFeature(index, { metric: e.target.value })}
                >
                  {[...available.filter((m) => m.key === feature.metric), ...unused].map((m) => (
                    <option key={m.key} value={m.key}>
                      {metricLabel(m.key)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="feature__pct">
                <span className="visually-hidden">{t('filters.features.percentile')}</span>
                <span className="feature__p" aria-hidden="true">
                  p
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  min={0}
                  max={100}
                  step={5}
                  value={feature.minPercentile}
                  onChange={(e) =>
                    setFeature(index, { minPercentile: Math.min(100, numberOrUndefined(e.target.value) ?? 0) })
                  }
                />
              </label>
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                aria-label={t('filters.features.remove')}
                onClick={() => onChange({ features: filters.features.filter((_, i) => i !== index) })}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn btn--add"
          disabled={unused.length === 0}
          onClick={() =>
            onChange({ features: [...filters.features, { metric: unused[0].key, minPercentile: 70 }] })
          }
        >
          <Plus size={16} aria-hidden="true" />
          {t('filters.features.add')}
        </button>
      </fieldset>

      <div className="field">
        <label htmlFor={`${uid}-league`}>{t('filters.league')}</label>
        <select
          id={`${uid}-league`}
          className="input"
          value={filters.leagueId ?? ''}
          onChange={(e) => onChange({ leagueId: numberOrUndefined(e.target.value), teamId: undefined })}
        >
          <option value="">{t('filters.league.all')}</option>
          {leagues.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${uid}-team`}>{t('filters.team')}</label>
        <select
          id={`${uid}-team`}
          className="input"
          value={filters.teamId ?? ''}
          disabled={filters.leagueId === undefined}
          onChange={(e) => onChange({ teamId: numberOrUndefined(e.target.value) })}
        >
          <option value="">
            {filters.leagueId === undefined ? t('filters.team.pickLeague') : t('filters.team.all')}
          </option>
          {(teams.data ?? []).map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${uid}-season`}>{t('filters.season')}</label>
        <select
          id={`${uid}-season`}
          className="input"
          value={filters.season ?? ''}
          onChange={(e) => onChange({ season: numberOrUndefined(e.target.value), teamId: undefined })}
        >
          <option value="">{t('filters.season.latest')}</option>
          {seasons.map((season) => (
            <option key={season} value={season}>
              {seasonLabel(season)}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="field field--pair">
        <legend>{t('filters.age')}</legend>
        <div className="pair">
          <label>
            <span className="pair__label">{t('filters.age.from')}</span>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              min={14}
              max={50}
              value={filters.minAge ?? ''}
              onChange={(e) => onChange({ minAge: numberOrUndefined(e.target.value) })}
            />
          </label>
          <label>
            <span className="pair__label">{t('filters.age.to')}</span>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              min={14}
              max={50}
              value={filters.maxAge ?? ''}
              onChange={(e) => onChange({ maxAge: numberOrUndefined(e.target.value) })}
            />
          </label>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={`${uid}-min`}>{t('filters.minutes')}</label>
        <input
          id={`${uid}-min`}
          type="number"
          inputMode="numeric"
          className="input"
          min={0}
          step={100}
          value={filters.minMinutes ?? ''}
          aria-describedby={`${uid}-min-hint`}
          onChange={(e) => onChange({ minMinutes: numberOrUndefined(e.target.value) })}
        />
        <p id={`${uid}-min-hint`} className="hint">
          {t('filters.minutes.hint')}
        </p>
      </div>

    </form>
  )
}
