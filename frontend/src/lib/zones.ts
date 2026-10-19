import type { MetricValue, Position } from '../api/types'

export type ZoneId = 'attack' | 'build' | 'defense' | 'goal'

/** Metriche (con percentile) che rappresentano ogni zona del campo. */
const ZONE_METRICS: Record<ZoneId, string[]> = {
  attack: ['goals_p90', 'shots_p90', 'shots_on_target_p90', 'assists_p90'],
  build: ['passes_p90', 'key_passes_p90', 'dribbles_success_p90'],
  defense: ['def_actions_p90', 'blocks_p90', 'duels_won_p90'],
  goal: ['saves_p90', 'goals_conceded_p90'],
}

/** Meno di due percentili non bastano a dire come va una zona: si dichiara "non disponibile". */
const MIN_ZONE_METRICS = 2

export interface ZoneScore {
  id: ZoneId
  /** media dei percentili delle metriche della zona (0-100), null se i dati non bastano */
  score: number | null
  /** quante metriche con percentile hanno contribuito */
  count: number
}

/** Zone da mostrare, dall'alto (attacco) al basso (difesa); i portieri hanno la sola zona porta. */
export function zonesFor(position: Position | null): ZoneId[] {
  return position === 'GK' ? ['goal'] : ['attack', 'build', 'defense']
}

/**
 * Profilo per zona: media dei percentili delle metriche reali della zona. Non sono posizioni in campo (i dati
 * non hanno coordinate): è una sintesi di quanto il giocatore pesa in ciascuna fase di gioco.
 */
export function zoneScores(metrics: MetricValue[], position: Position | null): ZoneScore[] {
  const byKey = new Map(metrics.map((m) => [m.key, m.percentile]))
  return zonesFor(position).map((id) => {
    const known = ZONE_METRICS[id].flatMap((key) => {
      const p = byKey.get(key)
      return p === null || p === undefined ? [] : [p]
    })
    if (known.length < MIN_ZONE_METRICS) return { id, score: null, count: known.length }
    return { id, score: Math.round(known.reduce((a, b) => a + b, 0) / known.length), count: known.length }
  })
}
