import { describe, expect, it } from 'vitest'
import type { MetricValue, PlayerDetail, PlayerNote, Projection, SeasonEntry } from '../../../api/types'
import { METRIC_LABELS } from '../../../i18n/metricLabels'
import { it as itDict } from '../../../i18n/it'
import { interpolate } from '../../../i18n/interpolate'
import { buildPlayerPdf, type PdfInput } from './buildPlayerPdf'

const metric = (key: string, percentile: number | null): MetricValue => ({
  key,
  label: key,
  unit: 'PER_90',
  value: 1.5,
  percentile,
  cohortSize: 30,
})

const ATT_METRICS = [
  'goals_p90',
  'shots_on_target_p90',
  'assists_p90',
  'key_passes_p90',
  'dribbles_success_p90',
  'duels_won_pct',
  'def_actions_p90',
  'rating',
  'shots_p90',
  'passes_p90',
  'blocks_p90',
  'duels_won_p90',
].map((key, i) => metric(key, 20 + i * 6))

function entryOf(overrides: Partial<SeasonEntry> = {}): SeasonEntry {
  return {
    season: 2024,
    team: { id: 1, name: 'Liverpool', logoUrl: null },
    league: { id: 1, name: 'Premier League', country: 'England', logoUrl: null },
    position: 'ATT',
    stats: {
      appearances: 38,
      lineups: 36,
      minutes: 3200,
      rating: 7.4,
      goals: 29,
      assists: 18,
    } as SeasonEntry['stats'],
    metrics: ATT_METRICS,
    ...overrides,
  }
}

function playerOf(name = 'Mohamed Salah', entry: SeasonEntry = entryOf()): PlayerDetail {
  return {
    id: 1,
    name,
    firstname: null,
    lastname: null,
    age: 33,
    birthDate: '1992-06-15',
    nationality: 'Egypt',
    heightCm: 175,
    weightKg: 71,
    photoUrl: null,
    position: 'ATT',
    lastSyncedAt: null,
    seasons: [entry],
  }
}

const projection: Projection = {
  available: true,
  reason: null,
  season: 2024,
  age: 33,
  score: 62,
  currentValueM: 8.2,
  points: [0, 1, 2, 3, 4, 5].map((i) => ({
    yearOffset: i,
    age: 33 + i,
    minM: 8.2 - i,
    midM: 8.2 - i * 0.6,
    maxM: 8.2 - i * 0.2,
  })),
}

const note = (id: number, body: string): PlayerNote => ({
  id,
  playerId: 1,
  body,
  createdAt: '2026-10-19T10:00:00Z',
  updatedAt: '2026-10-19T10:00:00Z',
})

function input(overrides: Partial<PdfInput> = {}): PdfInput {
  const entry = overrides.entry ?? entryOf()
  return {
    t: (key, vars) => interpolate(itDict[key], vars),
    metricLabel: (key) => METRIC_LABELS.it[key] ?? key,
    locale: 'it-IT',
    lang: 'it',
    player: playerOf('Mohamed Salah', entry),
    entry,
    projection,
    notes: [note(1, 'Ottimo primo controllo, cerca sempre il secondo palo.')],
    now: new Date('2026-10-19T12:00:00Z'),
    ...overrides,
  }
}

async function bytes(doc: Awaited<ReturnType<typeof buildPlayerPdf>>): Promise<string> {
  return new TextDecoder('latin1').decode(doc.output('arraybuffer'))
}

describe('buildPlayerPdf', () => {
  it('produce un PDF valido con i dati principali: profilo e stima in prima pagina, note in seconda', async () => {
    const doc = await buildPlayerPdf(input())
    const content = await bytes(doc)

    expect(content).toMatch(/^%PDF-/)
    expect(doc.getNumberOfPages()).toBe(2)
    expect(content).toContain('(Mohamed Salah)')
    expect(content).toContain('Liverpool')
    expect(content).toContain('8,2 M')
    expect(content).toContain('Ottimo primo controllo')
    expect(content).toContain('Pagina 1 di 2')
  })

  it('senza stima né note né percentili non si rompe e dice perché', async () => {
    const entry = entryOf({ metrics: [], position: null })
    const doc = await buildPlayerPdf(
      input({
        entry,
        player: playerOf('Giovane Senza Dati', entry),
        projection: {
          available: false,
          reason: 'MINUTES',
          season: 2024,
          age: 18,
          score: null,
          currentValueM: null,
          points: [],
        },
        notes: [],
      }),
    )

    expect(doc.getNumberOfPages()).toBe(1)
  })

  it('con la stima non ancora caricata (null) la dichiara non disponibile', async () => {
    const doc = await buildPlayerPdf(input({ projection: null }))

    expect(doc.getNumberOfPages()).toBe(1)
  })

  it('i portieri hanno la sola zona porta', async () => {
    const entry = entryOf({
      position: 'GK',
      metrics: [metric('saves_p90', 80), metric('goals_conceded_p90', 60), metric('rating', 90)],
    })

    const doc = await buildPlayerPdf(input({ entry, player: playerOf('M. Svilar', entry) }))
    const content = await bytes(doc)

    expect(content).toContain('Porta')
    expect(content).not.toContain('Costruzione')
  })

  it('molte note vanno a capo su più pagine e ogni pagina ha il piè di pagina', async () => {
    const many = Array.from({ length: 30 }, (_, i) => note(i, `Nota numero ${i}: ${'osservazione lunga '.repeat(12)}`))

    const doc = await buildPlayerPdf(input({ notes: many }))

    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
    expect(await bytes(doc)).toContain('Pagina 2 di')
  })

  it('i nomi con caratteri non latini non rompono il documento', async () => {
    const doc = await buildPlayerPdf(input({ player: playerOf('Мбаппе Pulišić Łukasz') }))

    expect(await bytes(doc)).toContain('(?????? Pulišic Lukasz)')
  })
})
