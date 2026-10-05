import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, activeFilterCount, parseFilters, serializeFilters, toApiParams } from './filters'

describe('filtri di ricerca', () => {
  it('legge dall\'URL gli stessi parametri dell\'API', () => {
    const f = parseFilters(
      new URLSearchParams('q=pul&position=MID&maxAge=22&season=2024&pct.def_actions_p90.min=70&sort=age&order=asc&page=2'),
    )

    expect(f.q).toBe('pul')
    expect(f.position).toBe('MID')
    expect(f.maxAge).toBe(22)
    expect(f.season).toBe(2024)
    expect(f.features).toEqual([{ metric: 'def_actions_p90', minPercentile: 70 }])
    expect(f.sort).toBe('age')
    expect(f.order).toBe('asc')
    expect(f.page).toBe(2)
  })

  it('ignora valori non validi invece di rompersi', () => {
    const f = parseFilters(new URLSearchParams('position=ALA&maxAge=abc&season=-3&pct.x.min=zzz&page=-1'))

    expect(f.position).toBeUndefined()
    expect(f.maxAge).toBeUndefined()
    expect(f.season).toBeUndefined()
    expect(f.features).toEqual([])
    expect(f.page).toBe(0)
  })

  it('limita il percentile tra 0 e 100', () => {
    const f = parseFilters(new URLSearchParams('pct.goals_p90.min=250'))

    expect(f.features[0].minPercentile).toBe(100)
  })

  it('serializza omettendo i valori di default', () => {
    expect(serializeFilters(EMPTY_FILTERS).toString()).toBe('')
    const params = serializeFilters({ ...EMPTY_FILTERS, position: 'ATT', features: [{ metric: 'goals_p90', minPercentile: 80 }] })

    expect(params.get('position')).toBe('ATT')
    expect(params.get('pct.goals_p90.min')).toBe('80')
    expect(params.has('sort')).toBe(false)
  })

  it('la serializzazione è reversibile', () => {
    const original = { ...EMPTY_FILTERS, q: 'x', leagueId: 1, minMinutes: 900, order: 'asc' as const, page: 3 }

    expect(parseFilters(serializeFilters(original))).toEqual(original)
  })

  it('i parametri per l\'API includono sempre ordine e dimensione pagina', () => {
    const p = toApiParams(EMPTY_FILTERS)

    expect(p.get('sort')).toBe('minutes')
    expect(p.get('order')).toBe('desc')
    expect(p.get('size')).toBe('25')
  })

  it('conta i filtri attivi, caratteristiche incluse', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, position: 'MID', features: [{ metric: 'a', minPercentile: 1 }] }),
    ).toBe(2)
  })
})
