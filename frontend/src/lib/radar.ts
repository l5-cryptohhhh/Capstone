export interface RadarPoint {
  /** indice dell'asse */
  index: number
  x: number
  y: number
}

const round = (n: number) => Math.round(n * 100) / 100

/** Angolo dell'asse i su n: il primo punta in alto, gli altri seguono in senso orario. */
export function axisAngle(index: number, count: number): number {
  return -Math.PI / 2 + (2 * Math.PI * index) / count
}

/** Punto sull'asse i a distanza proporzionale al valore (0-100, limitato) dal centro. */
export function polarPoint(
  index: number,
  count: number,
  value: number,
  cx: number,
  cy: number,
  radius: number,
): RadarPoint {
  const r = (radius * Math.min(100, Math.max(0, value))) / 100
  const angle = axisAngle(index, count)
  return { index, x: round(cx + r * Math.cos(angle)), y: round(cy + r * Math.sin(angle)) }
}

/** Punti del giocatore: gli assi senza percentile (null) non hanno punto, non si inventano a zero. */
export function radarPoints(values: (number | null)[], cx: number, cy: number, radius: number): RadarPoint[] {
  return values.flatMap((v, i) => (v === null ? [] : [polarPoint(i, values.length, v, cx, cy, radius)]))
}

/** Contorno chiuso che unisce i punti noti; con meno di 3 punti non è un'area e non si disegna. */
export function radarPath(points: RadarPoint[]): string {
  if (points.length < 3) return ''
  return `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')} Z`
}

/** Punti di un anello (valore uguale su tutti gli assi), per la griglia di fondo. */
export function ringPoints(count: number, value: number, cx: number, cy: number, radius: number): string {
  return Array.from({ length: count }, (_, i) => {
    const p = polarPoint(i, count, value, cx, cy, radius)
    return `${p.x},${p.y}`
  }).join(' ')
}

/** Toglie il suffisso "per 90'" (è uguale per quasi tutti gli assi) per lasciare più spazio al nome. */
export function shortLabel(label: string): string {
  return label.replace(/\s+(per|\/)\s*90['’]?\s*$/i, '').trim()
}

/** Spezza un'etichetta in righe di al massimo max caratteri, senza tagliare le parole. */
export function wrapLabel(label: string, max = 14): string[] {
  const lines: string[] = []
  for (const word of label.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1]
    if (last !== undefined && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}
