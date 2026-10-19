import { MarkGlyph, type MarkShape } from './ScaleRow'
import { useI18n } from '../i18n/useI18n'
import { axisAngle, polarPoint, radarPath, radarPoints, ringPoints, shortLabel, wrapLabel } from '../lib/radar'

export interface RadarAxis {
  key: string
  label: string
}

export interface RadarSeries {
  id: string
  name: string
  /** variabile CSS del colore (es. var(--mark-1)) */
  color: string
  /** la forma del segno distingue i giocatori anche senza vedere i colori */
  shape: MarkShape
  /** percentile 0-100 per asse, null se non disponibile */
  values: (number | null)[]
}

const WIDTH = 460
const HEIGHT = 340
const CX = WIDTH / 2
const CY = HEIGHT / 2
const RADIUS = 105
const RINGS = [25, 50, 75, 100]

function Marker({ shape, x, y, color }: { shape: MarkShape; x: number; y: number; color: string }) {
  if (shape === 'circle') return <circle cx={x} cy={y} r="4.5" fill="none" stroke={color} strokeWidth="2.2" />
  if (shape === 'square') {
    return <rect x={x - 4} y={y - 4} width="8" height="8" fill="none" stroke={color} strokeWidth="2.2" />
  }
  return (
    <path
      d={`M${x - 4} ${y - 4} L${x + 4} ${y + 4} M${x + 4} ${y - 4} L${x - 4} ${y + 4}`}
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
  )
}

/**
 * Radar dei percentili (0-100, rispetto ai pari ruolo): più il tratto è lontano dal centro, meglio si colloca il
 * giocatore. Gli assi senza percentile restano vuoti. I numeri sono anche in una tabella per le tecnologie assistive.
 */
export function Radar({ axes, series }: { axes: RadarAxis[]; series: RadarSeries[] }) {
  const { t } = useI18n()
  const n = axes.length

  return (
    <figure className="radar">
      <svg className="radar__svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" focusable="false">
        {RINGS.map((ring) => (
          <polygon key={ring} className="radar__ring" points={ringPoints(n, ring, CX, CY, RADIUS)} />
        ))}
        {axes.map((axis, i) => {
          const end = polarPoint(i, n, 100, CX, CY, RADIUS)
          return <line key={axis.key} className="radar__spoke" x1={CX} y1={CY} x2={end.x} y2={end.y} />
        })}

        {axes.map((axis, i) => {
          const angle = axisAngle(i, n)
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          const lines = wrapLabel(shortLabel(axis.label))
          const x = CX + (RADIUS + 14) * cos
          const y = CY + (RADIUS + 14) * sin
          const first =
            sin < -0.5 ? y - (lines.length - 1) * 12 : sin > 0.5 ? y + 8 : y - ((lines.length - 1) * 12) / 2 + 4
          return (
            <text
              key={axis.key}
              className="radar__label"
              x={x}
              y={first}
              textAnchor={cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle'}
            >
              {lines.map((line, j) => (
                <tspan key={line} x={x} dy={j === 0 ? 0 : 12}>
                  {line}
                </tspan>
              ))}
            </text>
          )
        })}

        {series.map((s) => {
          const points = radarPoints(s.values, CX, CY, RADIUS)
          const path = radarPath(points)
          return (
            <g key={s.id}>
              {path && (
                <path
                  d={path}
                  fill={s.color}
                  fillOpacity="0.16"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}
              {points.map((p) => (
                <Marker key={p.index} shape={s.shape} x={p.x} y={p.y} color={s.color} />
              ))}
            </g>
          )
        })}
      </svg>

      {series.length > 1 && (
        <figcaption className="cmp-legend">
          {series.map((s) => (
            <span key={s.id} className="cmp-legend__item">
              <MarkGlyph shape={s.shape} color={s.color} />
              {s.name}
            </span>
          ))}
        </figcaption>
      )}

      <table className="visually-hidden">
        <caption>{t('radar.table')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('radar.table.metric')}</th>
            {series.map((s) => (
              <th key={s.id} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {axes.map((axis, i) => (
            <tr key={axis.key}>
              <th scope="row">{axis.label}</th>
              {series.map((s) => (
                <td key={s.id}>{s.values[i] === null ? t('player.stamp.metric') : s.values[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
