import { describe, expect, it } from 'vitest'
import { polarPoint, radarPath, radarPoints, ringPoints, shortLabel, wrapLabel } from './radar'
import { radarAxisKeys, radarValues } from './radarAxes'

describe('geometria del radar', () => {
  it('il primo asse punta in alto e gli altri vanno in senso orario', () => {
    expect(polarPoint(0, 4, 100, 100, 100, 50)).toEqual({ index: 0, x: 100, y: 50 })
    expect(polarPoint(1, 4, 100, 100, 100, 50)).toEqual({ index: 1, x: 150, y: 100 })
    expect(polarPoint(2, 4, 100, 100, 100, 50)).toEqual({ index: 2, x: 100, y: 150 })
    expect(polarPoint(3, 4, 100, 100, 100, 50)).toEqual({ index: 3, x: 50, y: 100 })
  })

  it('la distanza dal centro è proporzionale al percentile e resta tra 0 e 100', () => {
    expect(polarPoint(0, 4, 50, 100, 100, 50)).toMatchObject({ x: 100, y: 75 })
    expect(polarPoint(0, 4, 0, 100, 100, 50)).toMatchObject({ x: 100, y: 100 })
    expect(polarPoint(0, 4, 250, 100, 100, 50)).toMatchObject({ x: 100, y: 50 })
    expect(polarPoint(0, 4, -20, 100, 100, 50)).toMatchObject({ x: 100, y: 100 })
  })

  it('gli assi senza percentile non hanno punto (non diventano zero)', () => {
    const points = radarPoints([100, null, 100, 100], 100, 100, 50)

    expect(points.map((p) => p.index)).toEqual([0, 2, 3])
  })

  it('il contorno ha bisogno di almeno tre punti', () => {
    expect(radarPath(radarPoints([80, null, null, null], 100, 100, 50))).toBe('')
    expect(radarPath(radarPoints([80, 60, null, null], 100, 100, 50))).toBe('')
    expect(radarPath(radarPoints([100, 100, 100, null], 100, 100, 50))).toBe('M100 50 L150 100 L100 150 Z')
  })

  it('gli anelli hanno un punto per asse', () => {
    expect(ringPoints(4, 100, 100, 100, 50)).toBe('100,50 150,100 100,150 50,100')
  })
})

describe('etichette', () => {
  it('toglie il suffisso per 90 in italiano e in inglese', () => {
    expect(shortLabel("Gol per 90'")).toBe('Gol')
    expect(shortLabel('Fouls committed per 90')).toBe('Fouls committed')
    expect(shortLabel('Duelli vinti %')).toBe('Duelli vinti %')
  })

  it('spezza le righe lunghe senza tagliare le parole', () => {
    expect(wrapLabel('Passaggi chiave')).toEqual(['Passaggi', 'chiave'])
    expect(wrapLabel('Gol')).toEqual(['Gol'])
    expect(wrapLabel('Dribbling riusciti', 20)).toEqual(['Dribbling riusciti'])
    expect(wrapLabel('Palloni recuperati')).toEqual(['Palloni', 'recuperati'])
  })
})

describe('assi per ruolo', () => {
  it('ogni ruolo ha il suo set e senza ruolo ce n\'è uno generico', () => {
    expect(radarAxisKeys('GK')).toEqual(['saves_p90', 'goals_conceded_p90', 'rating'])
    expect(radarAxisKeys('ATT')[0]).toBe('goals_p90')
    expect(radarAxisKeys(null)).toHaveLength(6)
  })

  it('legge i percentili per chiave e mette null dove manca la metrica', () => {
    const metrics = [
      { key: 'rating', label: '', unit: 'RATING', value: 7, percentile: 90, cohortSize: 20 },
      { key: 'saves_p90', label: '', unit: 'PER_90', value: 3, percentile: null, cohortSize: null },
    ] as Parameters<typeof radarValues>[1]

    expect(radarValues(['saves_p90', 'goals_conceded_p90', 'rating'], metrics)).toEqual([null, null, 90])
  })
})
