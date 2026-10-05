import type { TranslationKey } from '../i18n/it'

export interface MetricGroup {
  id: string
  labelKey: TranslationKey
  metrics: string[]
}

/** Raggruppamento delle metriche nella scheda: l'ordine è quello di lettura del dossier. */
export const METRIC_GROUPS: MetricGroup[] = [
  { id: 'overall', labelKey: 'player.group.overall', metrics: ['rating'] },
  { id: 'finishing', labelKey: 'player.group.finishing', metrics: ['goals_p90', 'shots_p90', 'shots_on_target_p90'] },
  { id: 'creation', labelKey: 'player.group.creation', metrics: ['assists_p90', 'key_passes_p90', 'passes_p90'] },
  {
    id: 'defending',
    labelKey: 'player.group.defending',
    metrics: ['def_actions_p90', 'blocks_p90', 'duels_won_p90', 'duels_won_pct'],
  },
  {
    id: 'dribbling',
    labelKey: 'player.group.dribbling',
    metrics: [
      'dribbles_attempted_p90',
      'dribbles_success_p90',
      'dribbles_success_pct',
      'fouls_drawn_p90',
      'fouls_committed_p90',
    ],
  },
  { id: 'goalkeeping', labelKey: 'player.group.goalkeeping', metrics: ['saves_p90', 'goals_conceded_p90'] },
]
