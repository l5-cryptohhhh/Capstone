import type { PlayerDetail, Position } from '../../api/types'
import { entryFor } from '../compare/helpers'

/** Una partita dura 90 minuti di gioco in 1 minuto reale: 1 minuto di gioco = 0,667 s. */
export const FULL_TIME_MINUTES = 90
export const REAL_DURATION_MS = 60_000

export function matchMinuteAt(elapsedMs: number): number {
  return Math.min(FULL_TIME_MINUTES, Math.max(0, (elapsedMs / REAL_DURATION_MS) * FULL_TIME_MINUTES))
}

/** Quanto vale un giocatore senza dati: sotto la media, perché non lo conosciamo. */
const UNKNOWN = 40

const ATTACK_METRICS = [
  'rating',
  'goals_p90',
  'shots_p90',
  'shots_on_target_p90',
  'assists_p90',
  'key_passes_p90',
  'dribbles_success_p90',
]
const DEFENCE_METRICS = ['rating', 'def_actions_p90', 'blocks_p90', 'duels_won_p90', 'duels_won_pct', 'saves_p90']

export interface Fielder {
  id: number
  name: string
  photoUrl: string | null
  position: Position | null
  /** 0-100: media dei percentili offensivi della stagione */
  att: number
  /** 0-100: media dei percentili difensivi della stagione */
  def: number
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : UNKNOWN
}

/** Trasforma la scheda di una stagione in forza d'attacco e di difesa, a partire dai percentili sul proprio ruolo. */
export function fielderFrom(player: PlayerDetail, season: number | undefined): Fielder {
  const entry = season === undefined ? undefined : entryFor(player, season)
  const percentile = (keys: string[]) =>
    (entry?.metrics ?? [])
      .filter((m) => keys.includes(m.key) && m.percentile !== null)
      .map((m) => m.percentile as number)
  return {
    id: player.id,
    name: player.name,
    photoUrl: player.photoUrl,
    position: entry?.position ?? player.position,
    att: mean(percentile(ATTACK_METRICS)),
    def: mean(percentile(DEFENCE_METRICS)),
  }
}

/** Peso del ruolo: un attaccante pesa in attacco, un difensore o portiere in difesa. */
const ROLE_WEIGHT: Record<Position | 'NONE', { att: number; def: number }> = {
  ATT: { att: 1.3, def: 0.5 },
  MID: { att: 1, def: 1 },
  DEF: { att: 0.6, def: 1.3 },
  GK: { att: 0.4, def: 1.4 },
  NONE: { att: 1, def: 1 },
}

const roleOf = (f: Fielder) => ROLE_WEIGHT[f.position ?? 'NONE']

function weighted(fielders: Fielder[], side: 'att' | 'def'): number {
  let sum = 0
  let weights = 0
  for (const f of fielders) {
    const w = roleOf(f)[side]
    sum += f[side] * w
    weights += w
  }
  return weights > 0 ? sum / weights : UNKNOWN
}

export function teamStrength(fielders: Fielder[]): { att: number; def: number } {
  return { att: weighted(fielders, 'att'), def: weighted(fielders, 'def') }
}

export type Side = 'home' | 'away'

export interface Point {
  x: number
  y: number
}

/** Campo in coordinate 1000 x 600; la squadra "home" attacca verso x = 1000. */
export const PITCH = { w: 1000, h: 600 }
export const CENTER: Point = { x: 500, y: 300 }

/** Indice del portiere come portatore di palla: i giocatori di movimento sono 0, 1, 2. */
export const KEEPER = 3

export const otherSide = (s: Side): Side => (s === 'home' ? 'away' : 'home')
/** Verso in cui attacca la squadra: +1 verso destra, -1 verso sinistra. */
export const directionOf = (s: Side): 1 | -1 => (s === 'home' ? 1 : -1)

/** Avanzamento della palla verso la porta avversaria, 0 (propria area) - 1 (area avversaria). */
export function zoneOf(side: Side, x: number): number {
  const z = side === 'home' ? (x - 70) / 860 : (930 - x) / 860
  return Math.min(1, Math.max(0, z))
}

/** Chi ha il pallone e dove si trova (il portatore è sempre sulla palla). */
export interface PlayState {
  side: Side
  carrier: number
  ball: Point
}

export type ActionKind = 'pass' | 'dribble' | 'shot' | 'foul' | 'restart'
export type Restart = 'kickoff' | 'throwIn' | 'corner' | 'goalKick' | 'freeKick' | 'keeper'
export type Outcome = 'goal' | 'saved' | 'miss' | 'blocked'

export interface Action {
  /** minuto di gioco d'inizio e durata, in minuti: le azioni sono contigue */
  start: number
  duration: number
  kind: ActionKind
  /** squadra in possesso all'inizio e giocatore sulla palla */
  side: Side
  carrier: number
  /** destinatario del passaggio (nella stessa squadra) */
  target?: number
  /** avversario coinvolto: chi intercetta, contrasta, para o respinge */
  rival?: number
  /** ok = la squadra mantiene il possesso; lost = lo perde; out = il pallone esce */
  result: 'ok' | 'lost' | 'out'
  outcome?: Outcome
  restart?: Restart
  /** stato al termine dell'azione e punto dove arriva il pallone (anche fuori dal campo) */
  after: PlayState
  ballEnd: Point
}

export interface MatchResult {
  initial: PlayState
  actions: Action[]
  homeGoals: number
  awayGoals: number
}

/** Corsia (y) abituale di ogni posto: 0 = il più arretrato (centro), 1 = sinistra, 2 = destra. */
export const LANE_Y = [300, 150, 450]

/** Posto in campo di ogni giocatore: 0 = il più arretrato, 2 = il più avanzato (chi è più offensivo). */
export function slotRanks(fielders: Fielder[]): number[] {
  const order = fielders
    .map((_, i) => i)
    .sort((a, b) => fielders[a].att - fielders[a].def - (fielders[b].att - fielders[b].def))
  const ranks = new Array<number>(fielders.length)
  order.forEach((player, rank) => {
    ranks[player] = Math.min(rank, 2)
  })
  return ranks
}

/** Minuti di gioco per ogni "unità" di durata: tiene i gesti a velocità naturale in una partita di 1 minuto. */
const ACTION_TIME_SCALE = 2

/** Probabilità di gol di un tiro a parità di attacco e difesa. */
const BASE_GOAL = 0.18
const GOAL_SCALE = 90
/** Quanto un portiere sopra o sotto la media (50) sposta la probabilità di gol. */
const KEEPER_SCALE = 70
/** Valore del portiere quando non è stato scelto: nella media. */
const AVERAGE_KEEPER = 50
/** Quanto il controllo di gioco (passaggi riusciti) cambia con il divario tra le squadre. */
const CONTROL_SCALE = 40

type Rng = () => number

function pickWeighted(weights: number[], rng: Rng): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return i
  }
  return weights.length - 1
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Simula 90 minuti di gioco continuo: il possesso passa di piede in piede, tra passaggi, dribbling, contrasti,
 * intercetti e tiri. Il gioco si ferma solo quando il pallone esce, c'è un fallo o un gol; poi si riparte
 * dalla rimessa. L'RNG è iniettato per poter ripetere e testare le partite.
 */
export function simulateMatch(
  home: Fielder[],
  away: Fielder[],
  rng: Rng = Math.random,
  keepers: Partial<Record<Side, Fielder>> = {},
): MatchResult {
  const squads: Record<Side, Fielder[]> = { home, away }
  const strength = { home: teamStrength(home), away: teamStrength(away) }
  const keeperRating = (s: Side) => keepers[s]?.def ?? AVERAGE_KEEPER
  const control = (s: Side) => (strength[s].att + strength[s].def) / 2

  const pickBy = (side: Side, score: (f: Fielder) => number, exclude?: number): number => {
    const weights = squads[side].map((f, i) => (i === exclude ? 0 : score(f)))
    return pickWeighted(weights, rng)
  }
  const pickAttacker = (side: Side, exclude?: number) =>
    pickBy(side, (f) => (f.att + 10) ** 2 * roleOf(f).att, exclude)
  const pickDefender = (side: Side) => pickBy(side, (f) => (f.def + 10) ** 2 * roleOf(f).def)
  const ranks = { home: slotRanks(home), away: slotRanks(away) }
  /** Chi è più vicino al punto (per corsia) ha più probabilità di arrivarci: intercetti e contrasti hanno una logica. */
  const pickNear = (side: Side, y: number, score: (f: Fielder) => number, exclude?: number) =>
    pickBy(side, (f) => score(f) * Math.exp(-Math.abs(LANE_Y[ranks[side][squads[side].indexOf(f)]] - y) / 120), exclude)
  const pickDefenderNear = (side: Side, y: number) => pickNear(side, y, (f) => (f.def + 10) ** 2 * roleOf(f).def)
  const pickAnyNear = (side: Side, y: number) => pickNear(side, y, (f) => (f.att + f.def + 20) ** 2)

  const initial: PlayState = { side: 'home', carrier: pickAttacker('home'), ball: CENTER }
  const actions: Action[] = []
  let state = initial
  let t = 0
  let mustPass = true
  let homeGoals = 0
  let awayGoals = 0

  const push = (a: Omit<Action, 'start'>) => {
    // Durata in minuti di gioco: la partita reale è breve, quindi ogni gesto dura più minuti di gioco
    // ma lo stesso tempo reale di prima, e i giocatori si muovono a velocità naturale.
    const scaled = { ...a, duration: a.duration * ACTION_TIME_SCALE }
    actions.push({ ...scaled, start: t })
    t += scaled.duration
    state = scaled.after
  }

  const restartAt = (restart: Restart, side: Side, ball: Point, carrier?: number) => {
    const duration = { kickoff: 0.9, throwIn: 0.6, corner: 0.9, goalKick: 0.7, freeKick: 0.8, keeper: 0.5 }[restart]
    const who = carrier ?? (restart === 'goalKick' || restart === 'keeper' ? pickDefender(side) : pickAttacker(side))
    push({
      duration,
      kind: 'restart',
      side,
      carrier: who,
      restart,
      result: 'ok',
      after: { side, carrier: who, ball },
      ballEnd: ball,
    })
    mustPass = true
  }

  const throwInSpot = (x: number, y: number): Point => ({ x: clamp(x, 60, 940), y: y < 300 ? 8 : 592 })
  const cornerSpot = (attacker: Side, y: number): Point => ({
    x: directionOf(attacker) === 1 ? 990 : 10,
    y: y < 300 ? 10 : 590,
  })

  while (t < FULL_TIME_MINUTES) {
    const A = state.side
    const O = otherSide(A)
    const dir = directionOf(A)
    const ball = state.ball
    const zone = zoneOf(A, ball.x)
    const me = squads[A][state.carrier] as Fielder | undefined

    const wantsShot = !mustPass && rng() < (zone > 0.7 ? 0.75 + (zone - 0.7) * 0.4 : zone > 0.5 ? 0.4 : 0.1)
    const wantsDribble = !mustPass && !wantsShot && rng() < 0.2
    mustPass = false

    if (wantsShot) {
      const edge = strength[A].att - strength[O].def
      const pGoal = clamp(
        BASE_GOAL * Math.exp(edge / GOAL_SCALE - (keeperRating(O) - AVERAGE_KEEPER) / KEEPER_SCALE),
        0.03,
        0.3,
      )
      const rival = pickDefenderNear(O, ball.y)
      const goalY = 300 + (rng() - 0.5) * 110
      const base = { duration: 0.9, kind: 'shot' as const, side: A, carrier: state.carrier, rival }
      if (rng() < pGoal) {
        if (A === 'home') homeGoals++
        else awayGoals++
        const kicker = pickAttacker(O)
        push({
          ...base,
          result: 'out',
          outcome: 'goal',
          after: { side: O, carrier: kicker, ball: CENTER },
          ballEnd: { x: dir === 1 ? 1024 : -24, y: goalY },
        })
        restartAt('kickoff', O, CENTER, kicker)
        continue
      }
      const outcome = (['saved', 'miss', 'blocked'] as const)[pickWeighted([0.45, 0.3, 0.25], rng)]
      if (outcome === 'saved') {
        const corner = rng() < 0.4
        const spot = cornerSpot(A, ball.y)
        const taker = pickAnyNear(A, spot.y)
        const holds: Point = { x: dir === 1 ? 925 : 75, y: 300 }
        push({
          ...base,
          result: 'out',
          outcome,
          after: corner ? { side: A, carrier: taker, ball: spot } : { side: O, carrier: KEEPER, ball: holds },
          ballEnd: { x: dir === 1 ? 950 : 50, y: goalY },
        })
        if (corner) restartAt('corner', A, spot, taker)
        else restartAt('keeper', O, holds, KEEPER)
      } else if (outcome === 'miss') {
        const spot: Point = { x: dir === 1 ? 925 : 75, y: 300 }
        push({
          ...base,
          result: 'out',
          outcome,
          after: { side: O, carrier: KEEPER, ball: spot },
          ballEnd: { x: dir === 1 ? 1040 : -40, y: goalY < 300 ? 90 : 510 },
        })
        restartAt('goalKick', O, spot, KEEPER)
      } else if (rng() < 0.5) {
        // respinto dalla difesa: il gioco prosegue con chi ha murato il tiro
        const rebound = { x: clamp(ball.x + dir * 60, 60, 940), y: clamp(ball.y + (rng() - 0.5) * 140, 40, 560) }
        push({ ...base, result: 'lost', outcome, after: { side: O, carrier: rival, ball: rebound }, ballEnd: rebound })
      } else {
        const out = { x: dir === 1 ? 1000 : 0, y: ball.y < 300 ? 30 : 570 }
        const spot = cornerSpot(A, ball.y)
        const taker = pickAnyNear(A, spot.y)
        push({ ...base, result: 'out', outcome, after: { side: A, carrier: taker, ball: spot }, ballEnd: out })
        restartAt('corner', A, spot, taker)
      }
      continue
    }

    if (wantsDribble) {
      const rival = pickDefenderNear(O, ball.y)
      const pOk = 0.52 + 0.22 * Math.tanh(((me?.att ?? 50) - squads[O][rival].def) / 35)
      const dz = 0.1 + rng() * 0.12
      const dest = {
        x: clamp(ball.x + dir * dz * 860, 60, 940),
        y: clamp(ball.y + (rng() - 0.5) * 160, 40, 560),
      }
      const base = { duration: 0.9, side: A, carrier: state.carrier, rival }
      if (rng() < pOk) {
        push({ ...base, kind: 'dribble', result: 'ok', after: { side: A, carrier: state.carrier, ball: dest }, ballEnd: dest })
      } else if (rng() < 0.16) {
        push({ ...base, kind: 'foul', result: 'ok', after: { side: A, carrier: state.carrier, ball }, ballEnd: ball })
        restartAt('freeKick', A, ball, state.carrier)
      } else {
        const lost = { x: clamp(ball.x + dir * 30, 60, 940), y: ball.y }
        push({ ...base, kind: 'dribble', result: 'lost', after: { side: O, carrier: rival, ball: lost }, ballEnd: lost })
      }
      continue
    }

    // Passaggio: avanti più spesso, ma anche laterale o all'indietro per ricostruire
    const target = pickBy(
      A,
      (f) => (zone > 0.5 ? (f.att + 10) ** 2 * roleOf(f).att : (f.att + f.def + 20) ** 2),
      state.carrier,
    )
    const r = rng()
    let dz = r < 0.55 ? 0.12 + rng() * 0.2 : r < 0.85 ? (rng() - 0.5) * 0.08 : -(0.06 + rng() * 0.1)
    if (zone > 0.88 && dz > 0) dz *= 0.3
    // Il passaggio va dove sta il compagno: verso la sua corsia abituale, non a caso
    const laneY = LANE_Y[ranks[A][target]]
    const dest = {
      x: clamp(ball.x + dir * dz * 860, 60, 940),
      y: clamp(lerp(ball.y, laneY, 0.6) + (rng() - 0.5) * 70, 45, 555),
    }
    const pOk = clamp(0.84 + 0.1 * Math.tanh((control(A) - control(O)) / CONTROL_SCALE), 0.6, 0.95)
    const duration = 0.55 + rng() * 0.35
    const base = { duration, kind: 'pass' as const, side: A, carrier: state.carrier, target }
    if (rng() < pOk) {
      push({ ...base, result: 'ok', after: { side: A, carrier: target, ball: dest }, ballEnd: dest })
    } else if ((dest.y < 110 || dest.y > 490) && rng() < 0.5) {
      // Esce solo se il passaggio era sulla fascia: la rimessa è dell'avversario, battuta da chi è più vicino
      const out = { x: dest.x, y: dest.y < 300 ? -25 : 625 }
      const spot = throwInSpot(dest.x, dest.y)
      const thrower = pickAnyNear(O, spot.y)
      push({ ...base, result: 'out', after: { side: O, carrier: thrower, ball: spot }, ballEnd: out })
      restartAt('throwIn', O, spot, thrower)
    } else {
      const rival = pickDefenderNear(O, dest.y)
      push({ ...base, rival, result: 'lost', after: { side: O, carrier: rival, ball: dest }, ballEnd: dest })
    }
  }

  return { initial, actions, homeGoals, awayGoals }
}
