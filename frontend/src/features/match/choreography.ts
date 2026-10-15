import { KEEPER, LANE_Y, PITCH, directionOf, otherSide, slotRanks, type Action, type Fielder, type MatchResult, type PlayState, type Point, type Side } from './engine'

export { PITCH }
export type { Point }

/** Punto dell'azione in cui il gol è "scattato": il punteggio si aggiorna qui. */
export const GOAL_AT = 0.7

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (t: number) => clamp(t, 0, 1)
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const mix = (a: Point, b: Point, t: number): Point => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) })

export interface Layout {
  home: Point[]
  away: Point[]
  /** i portieri restano in porta e seguono la palla */
  gk: Record<Side, Point>
}

export interface Frame extends Layout {
  ball: Point
  /** il pallone è in rete: serve per accendere la porta */
  inNet: boolean
  /** indice dell'azione in corso, per didascalia e cronaca */
  index: number
}

export interface Timeline {
  actions: Action[]
  initial: Layout & { ball: Point }
  /** layouts[i] = posizioni al termine dell'azione i */
  layouts: Layout[]
}

/** Distanza dal pallone, nel verso d'attacco, di chi attacca per posto (0 = arretrato). */
const ATTACK_OFFSET = [-190, -70, 70]
/** Distanza dal pallone di chi difende, verso la propria porta: il più arretrato resta indietro. */
const DEFEND_OFFSET = [270, 125, 75]
/** Distanza minima tra due pedine, così non si coprono. */
const MIN_GAP = 62

const wobble = (tick: number, k: number) => Math.sin(tick * 1.37 + k * 2.1) * 30

/** Dove si dispongono le sei pedine quando lo stato del gioco è `state`. */
function layoutFor(state: PlayState, ranks: Record<Side, number[]>, tick: number): Layout {
  const dir = directionOf(state.side)
  const atk = state.side
  const place = (side: Side, index: number): Point => {
    if (side === atk && index === state.carrier) return state.ball
    const rank = ranks[side][index]
    if (side === atk) {
      return {
        x: clamp(state.ball.x + dir * ATTACK_OFFSET[rank], 55, 945),
        y: clamp(lerp(LANE_Y[rank], state.ball.y, 0.35) + wobble(tick, index + rank), 40, 560),
      }
    }
    return {
      x: clamp(state.ball.x + dir * DEFEND_OFFSET[rank], 55, 945),
      y: clamp(lerp(LANE_Y[rank], state.ball.y, 0.55) + wobble(tick, index + 3 + rank), 40, 560),
    }
  }

  const home = ranks.home.map((_, i) => place('home', i))
  const away = ranks.away.map((_, i) => place('away', i))
  const keeper = (side: Side): Point =>
    atk === side && state.carrier === KEEPER
      ? state.ball
      : { x: side === 'home' ? 62 : 938, y: clamp(lerp(300, state.ball.y, 0.45), 240, 360) }

  // Due passate di allontanamento: le pedine non si sovrappongono (il portatore resta sulla palla)
  const all = [...home.map((p, i) => ({ p, fixed: atk === 'home' && i === state.carrier })), ...away.map((p, i) => ({ p, fixed: atk === 'away' && i === state.carrier }))]
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i]
        const b = all[j]
        const dx = b.p.x - a.p.x
        const dy = b.p.y - a.p.y
        const d = Math.hypot(dx, dy)
        if (d >= MIN_GAP) continue
        const push = (MIN_GAP - d) / 2 + 1
        const ny = d === 0 ? 1 : dy / d
        const nx = d === 0 ? 0 : dx / d
        if (!a.fixed) {
          a.p = { x: clamp(a.p.x - nx * push, 40, 960), y: clamp(a.p.y - ny * push * (b.fixed ? 2 : 1), 40, 560) }
        }
        if (!b.fixed) {
          b.p = { x: clamp(b.p.x + nx * push, 40, 960), y: clamp(b.p.y + ny * push * (a.fixed ? 2 : 1), 40, 560) }
        }
      }
    }
  }
  return {
    home: all.slice(0, home.length).map((e) => e.p),
    away: all.slice(home.length).map((e) => e.p),
    gk: { home: keeper('home'), away: keeper('away') },
  }
}

/** Costruisce, una volta sola, le posizioni di tutte le pedine alla fine di ogni azione. */
export function buildTimeline(result: MatchResult, home: Fielder[], away: Fielder[]): Timeline {
  const ranks = { home: slotRanks(home), away: slotRanks(away) }
  const first = layoutFor(result.initial, ranks, 0)
  return {
    actions: result.actions,
    initial: { ...first, ball: result.initial.ball },
    layouts: result.actions.map((a, i) => {
      const layout = layoutFor(a.after, ranks, i + 1)
      // Sul tiro il portiere si tuffa verso il punto in cui arriva il pallone
      if (a.kind === 'shot') {
        const keeper = otherSide(a.side)
        layout.gk[keeper] = { ...layout.gk[keeper], y: clamp(a.ballEnd.y, 235, 365) }
      }
      return layout
    }),
  }
}

/**
 * Interpola le pedine; chi sta per prendere palla (`lead`) usa la stessa curva del pallone, così arriva insieme
 * a lui invece di lasciarlo solo sul campo.
 */
function mixLayout(a: Layout, b: Layout, t: number, lead: { side: Side; index: number }, tLead: number): Layout {
  const at = (side: Side, i: number) => (lead.side === side && lead.index === i ? tLead : t)
  return {
    home: a.home.map((p, i) => mix(p, b.home[i], at('home', i))),
    away: a.away.map((p, i) => mix(p, b.away[i], at('away', i))),
    gk: {
      home: mix(a.gk.home, b.gk.home, at('home', KEEPER)),
      away: mix(a.gk.away, b.gk.away, at('away', KEEPER)),
    },
  }
}

/** Indice dell'azione che contiene il minuto (le azioni sono contigue e ordinate). */
function indexAt(actions: Action[], minute: number): number {
  let lo = 0
  let hi = actions.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (actions[mid].start <= minute) lo = mid
    else hi = mid - 1
  }
  return lo
}

/** Fotogramma al minuto di gioco dato: pedine e pallone interpolati tra la fine di un'azione e quella successiva. */
export function frameAt(tl: Timeline, minute: number): Frame {
  const { actions } = tl
  if (actions.length === 0) return { ...tl.initial, inNet: false, index: 0 }
  const index = indexAt(actions, minute)
  const a = actions[index]
  const p = clamp01((minute - a.start) / a.duration)

  const startLayout: Layout = index > 0 ? tl.layouts[index - 1] : tl.initial
  const startBall = index > 0 ? actions[index - 1].ballEnd : tl.initial.ball
  const endBall = a.ballEnd

  // Il pallone di un passaggio o di un tiro è veloce e frena; con il portatore (dribbling) viaggia con la pedina.
  const ballT = a.kind === 'pass' || a.kind === 'shot' || a.kind === 'restart' ? easeOut(p) : easeInOut(p)
  const pieces = mixLayout(
    startLayout,
    tl.layouts[index],
    easeInOut(p),
    { side: a.after.side, index: a.after.carrier },
    ballT,
  )

  const prev = index > 0 ? actions[index - 1] : undefined
  const inNet = (a.outcome === 'goal' && p >= GOAL_AT) || (prev?.outcome === 'goal' && p < 0.6)

  return { ...pieces, ball: mix(startBall, endBall, ballT), inNet, index }
}
