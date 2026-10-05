// Tipi che rispecchiano i DTO del backend (/api/v1). I valori mancanti arrivano come null, mai come 0.

export type Position = 'GK' | 'DEF' | 'MID' | 'ATT'
export type MetricUnit = 'PER_90' | 'PERCENT' | 'RATING'

export interface TeamRef {
  id: number
  name: string
  logoUrl: string | null
}

export interface LeagueRef {
  id: number
  name: string
  country: string | null
  logoUrl: string | null
}

export interface MetricValue {
  key: string
  label: string
  unit: MetricUnit
  value: number
  /** null se la coorte è troppo piccola o i minuti sono insufficienti */
  percentile: number | null
  cohortSize: number | null
}

export interface PlayerSummary {
  id: number
  name: string
  age: number | null
  nationality: string | null
  position: Position | null
  photoUrl: string | null
  team: TeamRef
  league: LeagueRef
  season: number
  minutes: number | null
  appearances: number | null
  goals: number | null
  assists: number | null
  rating: number | null
  /** valori delle metriche usate per filtrare o ordinare */
  metrics: Record<string, MetricValue>
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface StatLine {
  appearances: number | null
  lineups: number | null
  minutes: number | null
  rating: number | null
  goals: number | null
  assists: number | null
  goalsConceded: number | null
  saves: number | null
  shotsTotal: number | null
  shotsOn: number | null
  passesTotal: number | null
  passesKey: number | null
  tacklesTotal: number | null
  tacklesBlocks: number | null
  tacklesInterceptions: number | null
  duelsTotal: number | null
  duelsWon: number | null
  dribblesAttempts: number | null
  dribblesSuccess: number | null
  foulsDrawn: number | null
  foulsCommitted: number | null
  yellowCards: number | null
  redCards: number | null
}

export interface SeasonEntry {
  season: number
  team: TeamRef
  league: LeagueRef
  position: Position | null
  stats: StatLine
  metrics: MetricValue[]
}

export interface PlayerDetail {
  id: number
  name: string
  firstname: string | null
  lastname: string | null
  age: number | null
  birthDate: string | null
  nationality: string | null
  heightCm: number | null
  weightKg: number | null
  photoUrl: string | null
  position: Position | null
  lastSyncedAt: string | null
  seasons: SeasonEntry[]
}

export interface LeagueWithSeasons {
  id: number
  name: string
  country: string | null
  logoUrl: string | null
  seasons: number[]
}

export interface MetricInfo {
  key: string
  label: string
  description: string
  unit: MetricUnit
  higherIsBetter: boolean
  positions: Position[]
}

export interface ApiErrorBody {
  status: number
  code: string
  message: string
  path?: string
  details?: string[]
}
