import { describe, expect, it } from 'vitest'
import type { MetricValue } from '../api/types'
import { zoneScores, zonesFor } from './zones'

const metric = (key: string, percentile: number | null): MetricValue => ({
  key,
  label: '',
  unit: 'PER_90',
  value: 1,
  percentile,
  cohortSize: 20,
})

describe('zoneScores', () => {
  it('fa la media dei percentili delle metriche di ogni zona', () => {
    const scores = zoneScores(
      [
        metric('goals_p90', 90),
        metric('shots_p90', 70),
        metric('passes_p90', 40),
        metric('key_passes_p90', 60),
        metric('def_actions_p90', 10),
        metric('blocks_p90', 20),
      ],
      'ATT',
    )

    expect(scores).toEqual([
      { id: 'attack', score: 80, count: 2 },
      { id: 'build', score: 50, count: 2 },
      { id: 'defense', score: 15, count: 2 },
    ])
  })

  it('una zona con meno di due percentili non ha punteggio (non diventa zero)', () => {
    const scores = zoneScores([metric('goals_p90', 90), metric('shots_p90', null), metric('blocks_p90', 50)], 'ATT')

    expect(scores.map((z) => z.score)).toEqual([null, null, null])
    expect(scores[0].count).toBe(1)
  })

  it('ignora le metriche assenti e arrotonda', () => {
    const scores = zoneScores(
      [metric('passes_p90', 33), metric('key_passes_p90', 34), metric('dribbles_success_p90', 34)],
      'MID',
    )

    expect(scores.find((z) => z.id === 'build')?.score).toBe(34)
    expect(scores.find((z) => z.id === 'attack')?.score).toBeNull()
  })

  it('il portiere ha la sola zona porta', () => {
    expect(zonesFor('GK')).toEqual(['goal'])
    expect(zoneScores([metric('saves_p90', 80), metric('goals_conceded_p90', 60)], 'GK')).toEqual([
      { id: 'goal', score: 70, count: 2 },
    ])
  })

  it('senza ruolo mostra le tre zone da campo', () => {
    expect(zonesFor(null)).toEqual(['attack', 'build', 'defense'])
  })
})
