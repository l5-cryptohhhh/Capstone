import { describe, expect, it } from 'vitest'
import type { PlayerDetail, SeasonEntry } from '../../api/types'
import { bestIndex, commonSeason, entryFor, parseIds } from './helpers'

function entry(season: number, minutes: number, team = 1): SeasonEntry {
  return {
    season,
    team: { id: team, name: `T${team}`, logoUrl: null },
    league: { id: 1, name: 'L', country: null, logoUrl: null },
    position: 'MID',
    stats: { minutes } as SeasonEntry['stats'],
    metrics: [],
  }
}

function player(id: number, seasons: SeasonEntry[]): PlayerDetail {
  return { id, name: `P${id}`, seasons } as PlayerDetail
}

describe('helper del confronto', () => {
  it('legge gli id dall\'URL, senza duplicati né valori non validi, max 3', () => {
    expect(parseIds('1,2,2,x,-4,3,9')).toEqual([1, 2, 3])
    expect(parseIds(null)).toEqual([])
  })

  it('sceglie la stagione più recente comune a tutti', () => {
    const a = player(1, [entry(2024, 900), entry(2023, 900)])
    const b = player(2, [entry(2023, 900)])

    expect(commonSeason([a, b])).toBe(2023)
  })

  it('senza stagioni comuni usa la più recente in assoluto', () => {
    expect(commonSeason([player(1, [entry(2024, 1)]), player(2, [entry(2022, 1)])])).toBe(2024)
  })

  it('con più squadre nella stessa stagione sceglie quella con più minuti', () => {
    const p = player(1, [entry(2024, 300, 1), entry(2024, 1400, 2)])

    expect(entryFor(p, 2024)?.team.id).toBe(2)
  })

  it('trova il migliore rispettando la direzione della metrica', () => {
    expect(bestIndex([10, 30, 20], true)).toBe(1)
    expect(bestIndex([10, 30, 20], false)).toBe(0)
  })

  it('non indica un migliore in caso di parità o dati insufficienti', () => {
    expect(bestIndex([5, 5, 1], true)).toBeNull()
    expect(bestIndex([5, null, null], true)).toBeNull()
  })
})
