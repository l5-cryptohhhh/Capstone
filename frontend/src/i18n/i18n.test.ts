import { describe, expect, it } from 'vitest'
import { seasonLabel, formatNumber, initials } from '../lib/format'
import { en } from './en'
import { interpolate } from './interpolate'
import { it as italian } from './it'
import { METRIC_LABELS } from './metricLabels'

describe('traduzioni', () => {
  it('inglese e italiano hanno le stesse chiavi', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(italian).sort())
  })

  it('nessun testo contiene il trattino lungo', () => {
    const all = [...Object.values(en), ...Object.values(italian)]

    expect(all.filter((text) => text.includes('—'))).toEqual([])
  })

  it('le variabili segnaposto sono le stesse nelle due lingue', () => {
    const vars = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(italian) as (keyof typeof italian)[]) {
      expect(vars(en[key]), key).toEqual(vars(italian[key]))
    }
  })

  it('ogni metrica ha etichetta in entrambe le lingue', () => {
    expect(Object.keys(METRIC_LABELS.en).sort()).toEqual(Object.keys(METRIC_LABELS.it).sort())
  })

  it('interpola le variabili e lascia visibile quella mancante', () => {
    expect(interpolate('Pagina {page} di {total}', { page: 1, total: 4 })).toBe('Pagina 1 di 4')
    expect(interpolate('Ciao {nome}', {})).toBe('Ciao {nome}')
  })
})

describe('formati', () => {
  it('etichetta la stagione come in uso nel calcio', () => {
    expect(seasonLabel(2024)).toBe('2024/25')
    expect(seasonLabel(2099)).toBe('2099/00')
  })

  it('i valori mancanti restano un trattino, mai zero', () => {
    expect(formatNumber(null, 'it-IT')).toBe('-')
    expect(formatNumber(undefined, 'it-IT', 2)).toBe('-')
    expect(formatNumber(0, 'it-IT')).toBe('0')
  })

  it('usa i decimali della lingua', () => {
    expect(formatNumber(7.236, 'it-IT', 2)).toBe('7,24')
    expect(formatNumber(7.236, 'en-GB', 2)).toBe('7.24')
  })

  it('ricava le iniziali dal nome', () => {
    expect(initials('C. Pulišić')).toBe('CP')
    expect(initials('Lautaro Martínez')).toBe('LM')
    expect(initials('')).toBe('?')
  })
})
