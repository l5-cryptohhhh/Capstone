import { describe, expect, it } from 'vitest'
import type { AiFilters } from '../../api/types'
import { it as itDict, type TranslationKey } from '../../i18n/it'
import { interpolate, type Vars } from '../../i18n/interpolate'
import { aiChips } from './aiChips'

const t = (key: TranslationKey, vars?: Vars) => interpolate(itDict[key], vars)
const none: AiFilters = {
  name: null,
  position: null,
  team: null,
  league: null,
  season: null,
  minAge: null,
  maxAge: null,
  minMinutes: null,
  sort: null,
}

describe('aiChips', () => {
  it('descrive solo i filtri presenti', () => {
    expect(aiChips({ ...none, position: 'ATT', maxAge: 23, sort: 'goals' }, t)).toEqual([
      'Ruolo: Attaccante',
      'Età fino a 23',
      'Ordinato per: gol',
    ])
  })

  it('ignora stringhe vuote e ordinamenti sconosciuti', () => {
    expect(aiChips({ ...none, name: '  ', team: 'Inter', sort: 'speed' }, t)).toEqual(['Squadra: Inter'])
  })

  it('mostra la stagione come 2024/25', () => {
    expect(aiChips({ ...none, season: 2024 }, t)).toEqual(['Stagione: 2024/25'])
  })
})
