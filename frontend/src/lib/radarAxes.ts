import type { MetricValue, Position } from '../api/types'

/**
 * Metriche del radar per ruolo (percentili già calcolati sui pari ruolo). L'ordine è quello di lettura, in senso
 * orario: prima ciò che definisce il ruolo, poi il resto. Per falli commessi il percentile è già invertito.
 */
const AXES: Record<Position | 'DEFAULT', string[]> = {
  ATT: [
    'goals_p90',
    'shots_on_target_p90',
    'assists_p90',
    'key_passes_p90',
    'dribbles_success_p90',
    'duels_won_pct',
    'def_actions_p90',
    'rating',
  ],
  MID: [
    'key_passes_p90',
    'passes_p90',
    'assists_p90',
    'goals_p90',
    'dribbles_success_p90',
    'duels_won_pct',
    'def_actions_p90',
    'rating',
  ],
  DEF: [
    'def_actions_p90',
    'blocks_p90',
    'duels_won_p90',
    'duels_won_pct',
    'passes_p90',
    'key_passes_p90',
    'fouls_committed_p90',
    'rating',
  ],
  GK: ['saves_p90', 'goals_conceded_p90', 'rating'],
  DEFAULT: ['goals_p90', 'assists_p90', 'key_passes_p90', 'def_actions_p90', 'duels_won_pct', 'rating'],
}

/** Chiavi delle metriche per gli assi del ruolo (senza ruolo noto, un set generico). */
export function radarAxisKeys(position: Position | null): string[] {
  return AXES[position ?? 'DEFAULT']
}

/** Percentile di ogni asse, nello stesso ordine; null se la metrica o il percentile mancano. */
export function radarValues(keys: string[], metrics: MetricValue[]): (number | null)[] {
  const byKey = new Map(metrics.map((m) => [m.key, m.percentile]))
  return keys.map((key) => byKey.get(key) ?? null)
}
