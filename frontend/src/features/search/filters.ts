import type { Position } from '../../api/types'

/** Una caratteristica richiesta: la metrica deve essere almeno al percentile indicato rispetto ai pari ruolo. */
export interface FeatureFilter {
  metric: string
  minPercentile: number
}

export interface Filters {
  q: string
  position?: Position
  leagueId?: number
  teamId?: number
  season?: number
  minAge?: number
  maxAge?: number
  minMinutes?: number
  features: FeatureFilter[]
  sort: string
  order: 'asc' | 'desc'
  page: number
}

export const DEFAULT_SORT = 'minutes'
export const PAGE_SIZE = 25
export const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'ATT']

export const EMPTY_FILTERS: Filters = {
  q: '',
  features: [],
  sort: DEFAULT_SORT,
  order: 'desc',
  page: 0,
}

function int(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

/** Legge i filtri dall'URL. L'URL usa gli stessi nomi dei parametri dell'API, quindi ogni ricerca è condivisibile. */
export function parseFilters(params: URLSearchParams): Filters {
  const features: FeatureFilter[] = []
  params.forEach((value, name) => {
    const match = /^pct\.([a-z0-9_]+)\.min$/.exec(name)
    const n = Number(value)
    if (match && Number.isFinite(n)) {
      features.push({ metric: match[1], minPercentile: Math.min(100, Math.max(0, Math.round(n))) })
    }
  })

  const position = params.get('position')
  return {
    q: params.get('q') ?? '',
    position: POSITIONS.includes(position as Position) ? (position as Position) : undefined,
    leagueId: int(params.get('leagueId')),
    teamId: int(params.get('teamId')),
    season: int(params.get('season')),
    minAge: int(params.get('minAge')),
    maxAge: int(params.get('maxAge')),
    minMinutes: int(params.get('minMinutes')),
    features,
    sort: params.get('sort') ?? DEFAULT_SORT,
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
    page: int(params.get('page')) ?? 0,
  }
}

/** Serializza i filtri omettendo i valori di default, per URL brevi e leggibili. */
export function serializeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.position) p.set('position', f.position)
  if (f.leagueId !== undefined) p.set('leagueId', String(f.leagueId))
  if (f.teamId !== undefined) p.set('teamId', String(f.teamId))
  if (f.season !== undefined) p.set('season', String(f.season))
  if (f.minAge !== undefined) p.set('minAge', String(f.minAge))
  if (f.maxAge !== undefined) p.set('maxAge', String(f.maxAge))
  if (f.minMinutes !== undefined) p.set('minMinutes', String(f.minMinutes))
  for (const feature of f.features) p.set(`pct.${feature.metric}.min`, String(feature.minPercentile))
  if (f.sort !== DEFAULT_SORT) p.set('sort', f.sort)
  if (f.order !== 'desc') p.set('order', f.order)
  if (f.page > 0) p.set('page', String(f.page))
  return p
}

/** Parametri per GET /players: stessi dell'URL, più la dimensione pagina e l'ordine sempre espliciti. */
export function toApiParams(f: Filters): URLSearchParams {
  const p = serializeFilters(f)
  p.set('sort', f.sort)
  p.set('order', f.order)
  p.set('page', String(f.page))
  p.set('size', String(PAGE_SIZE))
  return p
}

export function activeFilterCount(f: Filters): number {
  return [f.q.trim(), f.position, f.leagueId, f.teamId, f.season, f.minAge, f.maxAge, f.minMinutes].filter(
    (v) => v !== undefined && v !== '',
  ).length + f.features.length
}
