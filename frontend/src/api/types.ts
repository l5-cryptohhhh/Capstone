// Tipi che rispecchiano i DTO del backend (/api/v1). I valori mancanti arrivano come null, mai come 0.

export type Position = 'GK' | 'DEF' | 'MID' | 'ATT'
type MetricUnit = 'PER_90' | 'PERCENT' | 'RATING'

export interface TeamRef {
  id: number
  name: string
  logoUrl: string | null
}

interface LeagueRef {
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
  locked: false
}

/**
 * Riga riservata agli utenti registrati: del giocatore il backend non invia nulla oltre a ruolo, squadra e
 * campionato.
 */
interface LockedPlayerSummary {
  locked: true
  position: Position | null
  team: TeamRef
  league: LeagueRef
  season: number
}

export type PlayerRow = PlayerSummary | LockedPlayerSummary

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

/** Filtri che l'AI ha ricavato dalla frase: solo i campi citati sono presenti. */
export interface AiFilters {
  name: string | null
  position: Position | null
  team: string | null
  league: string | null
  season: number | null
  minAge: number | null
  maxAge: number | null
  minMinutes: number | null
  sort: string | null
}

export interface AiSearchResult {
  interpreted: AiFilters
  results: PageResponse<PlayerSummary>
}

export interface PlayerReport {
  playerId: number
  report: string
}

/** Giocatore statisticamente vicino: similarity 0-100, calcolata su commonMetrics percentili. */
export interface SimilarPlayer {
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
  similarity: number
  commonMetrics: number
}

export interface CompareVerdict {
  playerIds: number[]
  season: number
  verdict: string
}

export interface ApiErrorBody {
  status: number
  code: string
  message: string
  path?: string
  details?: string[]
}

/** Nota privata dell'utente su un giocatore (date ISO 8601). */
export interface PlayerNote {
  id: number
  playerId: number
  body: string
  createdAt: string
  updatedAt: string
}

/** Lista privata di giocatori. contains: ha già il giocatore chiesto con ?playerId. */
export interface Watchlist {
  id: number
  name: string
  playerCount: number
  contains: boolean
}

/** Giocatore in una lista, con l'ultima stagione disponibile (squadra e numeri null se non ne ha). */
export interface WatchlistPlayer {
  id: number
  name: string
  age: number | null
  position: 'GK' | 'DEF' | 'MID' | 'ATT' | null
  photoUrl: string | null
  team: TeamRef | null
  league: { id: number; name: string } | null
  season: number | null
  minutes: number | null
  rating: number | null
}

export interface WatchlistDetail {
  id: number
  name: string
  players: WatchlistPlayer[]
}

export interface ProjectionPoint {
  /** anni da oggi (0 = stima attuale) */
  yearOffset: number
  age: number
  /** milioni di euro */
  minM: number
  midM: number
  maxM: number
}

/** Stima euristica di valore e crescita. Se available è false, reason dice perché mancano i dati. */
export interface Projection {
  available: boolean
  reason: 'NO_SEASON' | 'NO_AGE' | 'MINUTES' | 'PERCENTILES' | null
  season: number | null
  age: number | null
  score: number | null
  currentValueM: number | null
  points: ProjectionPoint[]
}
