import { describe, expect, it } from 'vitest'
import type { PlayerDetail, SeasonEntry } from '../../api/types'
import {
  FULL_TIME_MINUTES,
  KEEPER,
  REAL_DURATION_MS,
  fielderFrom,
  matchMinuteAt,
  simulateMatch,
  teamStrength,
  type Fielder,
} from './engine'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const fielder = (id: number, level: number, position: Fielder['position'] = 'MID'): Fielder => ({
  id,
  name: `P${id}`,
  photoUrl: null,
  position,
  att: level,
  def: level,
})
const squad = (level: number, base: number): Fielder[] => [
  fielder(base, level, 'ATT'),
  fielder(base + 1, level, 'MID'),
  fielder(base + 2, level, 'DEF'),
]

function stats(home: Fielder[], away: Fielder[], runs = 1000) {
  const rng = mulberry32(7)
  let homeWins = 0
  let awayWins = 0
  let draws = 0
  let goals = 0
  for (let i = 0; i < runs; i++) {
    const m = simulateMatch(home, away, rng)
    goals += m.homeGoals + m.awayGoals
    if (m.homeGoals > m.awayGoals) homeWins++
    else if (m.homeGoals < m.awayGoals) awayWins++
    else draws++
  }
  return { homeWins: homeWins / runs, awayWins: awayWins / runs, draws: draws / runs, goalsPerMatch: goals / runs }
}

describe('tempo', () => {
  it('90 minuti di gioco durano esattamente 1 minuto reale', () => {
    expect(REAL_DURATION_MS).toBe(60_000)
    expect(matchMinuteAt(0)).toBe(0)
    expect(matchMinuteAt(30_000)).toBeCloseTo(45, 6)
    expect(matchMinuteAt(60_000)).toBe(FULL_TIME_MINUTES)
    expect(matchMinuteAt(999_999)).toBe(FULL_TIME_MINUTES)
  })
})

describe('fielderFrom', () => {
  const entry = (metrics: [string, number | null][], position: SeasonEntry['position'] = 'ATT'): SeasonEntry =>
    ({
      season: 2024,
      position,
      metrics: metrics.map(([key, percentile]) => ({ key, label: key, unit: 'PER_90', value: 1, percentile, cohortSize: 50 })),
    }) as unknown as SeasonEntry
  const player = (e: SeasonEntry): PlayerDetail =>
    ({ id: 1, name: 'A', photoUrl: null, position: null, seasons: [e] }) as unknown as PlayerDetail

  it('ricava attacco e difesa dai percentili', () => {
    const f = fielderFrom(player(entry([['goals_p90', 90], ['shots_p90', 80], ['blocks_p90', 20]])), 2024)
    expect(f.att).toBe(85)
    expect(f.def).toBe(20)
  })

  it('senza dati usa un valore sotto la media, non zero', () => {
    const f = fielderFrom(player(entry([['goals_p90', null]])), 2024)
    expect(f.att).toBeGreaterThan(20)
    expect(f.att).toBeLessThan(50)
  })
})

describe('simulateMatch', () => {
  it('è deterministico con lo stesso seme e le azioni sono contigue', () => {
    const a = simulateMatch(squad(60, 1), squad(60, 10), mulberry32(3))
    const b = simulateMatch(squad(60, 1), squad(60, 10), mulberry32(3))
    expect(a).toEqual(b)
    expect(a.actions[0].start).toBe(0)
    for (let i = 1; i < a.actions.length; i++) {
      expect(a.actions[i].start).toBeCloseTo(a.actions[i - 1].start + a.actions[i - 1].duration, 9)
    }
    const last = a.actions[a.actions.length - 1]
    expect(last.start + last.duration).toBeGreaterThanOrEqual(FULL_TIME_MINUTES)
  })

  it('il punteggio coincide con i gol nelle azioni', () => {
    const m = simulateMatch(squad(70, 1), squad(40, 10), mulberry32(11))
    const goals = m.actions.filter((a) => a.outcome === 'goal')
    expect(goals.filter((a) => a.side === 'home').length).toBe(m.homeGoals)
    expect(goals.filter((a) => a.side === 'away').length).toBe(m.awayGoals)
  })

  it('il gioco è continuo: tante azioni e il pallone si ferma solo per uscita, fallo o gol', () => {
    const rng = mulberry32(5)
    let passes = 0
    let restarts = 0
    let longestChain = 0
    let chain = 0
    for (let i = 0; i < 50; i++) {
      for (const a of simulateMatch(squad(60, 1), squad(60, 10), rng).actions) {
        if (a.kind === 'restart') {
          restarts++
          longestChain = Math.max(longestChain, chain)
          chain = 0
        } else {
          chain++
          if (a.kind === 'pass') passes++
        }
      }
    }
    expect(passes / 50).toBeGreaterThan(25)
    // tra una ripartenza e l'altra ci sono in media più azioni di gioco: nessun "passaggio-tiro-gol" a macchinetta
    expect(passes / restarts).toBeGreaterThan(1.8)
    expect(longestChain).toBeGreaterThan(4)
  })

  it('a pari livello i tiri sono in numero realistico', () => {
    const rng = mulberry32(21)
    let shots = 0
    for (let i = 0; i < 200; i++) {
      shots += simulateMatch(squad(60, 1), squad(60, 10), rng).actions.filter((a) => a.kind === 'shot').length
    }
    expect(shots / 200).toBeGreaterThan(12)
    expect(shots / 200).toBeLessThan(34)
  })

  it('a pari livello è equilibrata e con un numero di gol realistico', () => {
    const s = stats(squad(60, 1), squad(60, 10))
    expect(Math.abs(s.homeWins - s.awayWins)).toBeLessThan(0.1)
    expect(s.goalsPerMatch).toBeGreaterThan(1.8)
    expect(s.goalsPerMatch).toBeLessThan(3.4)
  })

  it('i migliori vincono molto più spesso ma i deboli non sono a zero', () => {
    const s = stats(squad(85, 1), squad(30, 10))
    expect(s.homeWins).toBeGreaterThan(0.7)
    expect(s.homeWins).toBeLessThan(0.97)
    expect(s.awayWins).toBeGreaterThan(0)
    // invertendo i lati vale lo stesso: il fattore campo non deve decidere
    const r = stats(squad(30, 10), squad(85, 1))
    expect(r.awayWins).toBeGreaterThan(0.7)
  })

  it('un divario piccolo dà un vantaggio piccolo', () => {
    const s = stats(squad(65, 1), squad(55, 10))
    expect(s.homeWins).toBeGreaterThan(s.awayWins)
    expect(s.homeWins).toBeLessThan(0.6)
  })
})

describe('coerenza delle azioni', () => {
  it('ogni azione parte da dove ha lasciato la palla la precedente', () => {
    const rng = mulberry32(31)
    for (let i = 0; i < 40; i++) {
      const m = simulateMatch(squad(60, 1), squad(50, 10), rng, {})
      let prev = m.initial
      for (const a of m.actions) {
        expect(a.side).toBe(prev.side)
        expect(a.carrier).toBe(prev.carrier)
        prev = a.after
      }
    }
  })

  it('un passaggio esce solo sulla fascia e la rimessa è dell’avversario', () => {
    const rng = mulberry32(8)
    let outs = 0
    for (let i = 0; i < 100; i++) {
      const { actions } = simulateMatch(squad(60, 1), squad(60, 10), rng, {})
      actions.forEach((a, k) => {
        if (a.kind === 'pass' && a.result === 'out') {
          outs++
          expect(a.after.ball.y === 8 || a.after.ball.y === 592).toBe(true)
          expect(a.after.side).not.toBe(a.side)
          expect(actions[k + 1].restart).toBe('throwIn')
        }
      })
    }
    expect(outs).toBeGreaterThan(0)
  })
})

describe('portieri', () => {
  const goalsAgainst = (keeper: number) => {
    const rng = mulberry32(9)
    let goals = 0
    for (let i = 0; i < 600; i++) {
      goals += simulateMatch(squad(60, 1), squad(60, 10), rng, { away: fielder(99, keeper, 'GK') }).homeGoals
    }
    return goals / 600
  }

  it('un portiere forte subisce meno gol di uno scarso', () => {
    expect(goalsAgainst(90)).toBeLessThan(goalsAgainst(15))
  })

  it('il portiere riparte con palla in mano dopo una parata o un rinvio', () => {
    const rng = mulberry32(2)
    const restarts = simulateMatch(squad(60, 1), squad(60, 10), rng, {}).actions.filter(
      (a) => a.kind === 'restart' && (a.restart === 'keeper' || a.restart === 'goalKick'),
    )
    expect(restarts.length).toBeGreaterThan(0)
    expect(restarts.every((a) => a.carrier === KEEPER)).toBe(true)
  })
})

describe('teamStrength', () => {
  it('un attaccante pesa di più in attacco e un difensore in difesa', () => {
    const a = teamStrength([fielder(1, 80, 'ATT'), fielder(2, 40, 'MID'), fielder(3, 40, 'DEF')])
    const b = teamStrength([fielder(1, 40, 'ATT'), fielder(2, 40, 'MID'), fielder(3, 80, 'DEF')])
    expect(a.att).toBeGreaterThan(b.att)
    expect(b.def).toBeGreaterThan(a.def)
  })
})
