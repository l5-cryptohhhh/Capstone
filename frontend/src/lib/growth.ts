import type { ProjectionPoint } from '../api/types'

export interface Plot {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
}

/** Passo "tondo" (1, 2, 2.5, 5 o 10 per una potenza di dieci) non inferiore al valore indicato. */
function niceStep(value: number): number {
  const power = 10 ** Math.floor(Math.log10(value))
  return ([1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10) * power
}

export interface Axis {
  /** estremo superiore dell'asse, multiplo del passo e mai sotto il valore massimo */
  max: number
  ticks: number[]
}

/** Asse y da 0 al valore massimo, con una tacca ogni passo "tondo" (circa quattro intervalli). */
export function axisFor(value: number): Axis {
  if (!(value > 0)) return { max: 1, ticks: [0, 1] }
  const step = niceStep(value / 4)
  const count = Math.ceil(value / step - 1e-9)
  const round = (n: number) => Math.round(n * 1e6) / 1e6
  return { max: round(step * count), ticks: Array.from({ length: count + 1 }, (_, i) => round(step * i)) }
}

/** Posizione x dell'i-esimo punto su n, distribuiti in modo uniforme nell'area del grafico. */
export function xAt(index: number, count: number, plot: Plot): number {
  const span = plot.width - plot.left - plot.right
  return Math.round((plot.left + (count <= 1 ? span / 2 : (span * index) / (count - 1))) * 100) / 100
}

/** Posizione y di un valore tra 0 e max (0 in basso). */
export function yAt(value: number, max: number, plot: Plot): number {
  const span = plot.height - plot.top - plot.bottom
  const clamped = Math.min(max, Math.max(0, value))
  return Math.round((plot.height - plot.bottom - (span * clamped) / max) * 100) / 100
}

/** Linea che unisce i valori (uno per punto). */
export function linePath(values: number[], max: number, plot: Plot): string {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, values.length, plot)} ${yAt(v, max, plot)}`).join(' ')
}

/** Area tra due linee (minimo sotto, massimo sopra): sale lungo il massimo e torna indietro sul minimo. */
export function bandPath(min: number[], maxValues: number[], max: number, plot: Plot): string {
  const n = min.length
  const up = maxValues.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, n, plot)} ${yAt(v, max, plot)}`)
  const down = min.map((v, i) => `L${xAt(i, n, plot)} ${yAt(v, max, plot)}`).reverse()
  return `${up.join(' ')} ${down.join(' ')} Z`
}

/** Asse del grafico: copre lo scenario massimo più alto. */
export function chartAxis(points: ProjectionPoint[]): Axis {
  return axisFor(Math.max(...points.map((p) => p.maxM)))
}
