import type { PlayerDetail, SeasonEntry } from '../../api/types'
import type { MarkShape } from '../../components/ScaleRow'

interface Slot {
  color: string
  shape: MarkShape
}

/** Un colore e una forma per giocatore: la forma garantisce la lettura anche senza distinguere i colori. */
export const SLOTS: Slot[] = [
  { color: 'var(--mark-1)', shape: 'x' },
  { color: 'var(--mark-2)', shape: 'circle' },
  { color: 'var(--mark-3)', shape: 'square' },
]

export function parseIds(raw: string | null): number[] {
  if (!raw) return []
  const ids = raw
    .split(',')
    .map((part) => Number(part))
    .filter((n) => Number.isInteger(n) && n > 0)
  return [...new Set(ids)].slice(0, SLOTS.length)
}

/** Voce del giocatore per la stagione scelta; con più squadre sceglie quella con più minuti. */
export function entryFor(player: PlayerDetail, season: number): SeasonEntry | undefined {
  return player.seasons
    .filter((s) => s.season === season)
    .sort((a, b) => (b.stats.minutes ?? 0) - (a.stats.minutes ?? 0))[0]
}

/** Stagione più recente disponibile per tutti i giocatori; altrimenti la più recente in assoluto. */
export function commonSeason(players: PlayerDetail[]): number | undefined {
  const sets = players.map((p) => new Set(p.seasons.map((s) => s.season)))
  const common = [...(sets[0] ?? [])].filter((s) => sets.every((set) => set.has(s)))
  const pool = common.length > 0 ? common : players.flatMap((p) => p.seasons.map((s) => s.season))
  return pool.length > 0 ? Math.max(...pool) : undefined
}

/** Indice del migliore tra i valori (null se meno di due sono confrontabili o c'è parità). */
export function bestIndex(values: (number | null)[], higherIsBetter: boolean): number | null {
  const known = values.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v !== null)
  if (known.length < 2) return null
  const best = known.reduce((a, b) => ((higherIsBetter ? b.v > a.v : b.v < a.v) ? b : a))
  const ties = known.filter((x) => x.v === best.v).length
  return ties > 1 ? null : best.i
}

