import type { ProjectionPoint } from '../api/types'
import { useI18n } from '../i18n/useI18n'
import { formatNumber } from '../lib/format'
import { bandPath, chartAxis, linePath, xAt, yAt, type Plot } from '../lib/growth'

const PLOT: Plot = { width: 520, height: 260, left: 48, right: 20, top: 14, bottom: 40 }

/**
 * Traiettoria stimata del valore (milioni di euro): linea media, tratteggi per minimo e massimo e area tra i due.
 * È una stima euristica, non una previsione: l'area si allarga con gli anni perché l'incertezza cresce.
 */
export function GrowthChart({ points }: { points: ProjectionPoint[] }) {
  const { t, locale } = useI18n()
  const { max, ticks } = chartAxis(points)
  const mid = points.map((p) => p.midM)
  const low = points.map((p) => p.minM)
  const high = points.map((p) => p.maxM)
  const fmt = (v: number) => formatNumber(v, locale, v >= 10 || Number.isInteger(v) ? 0 : 1)

  return (
    <figure className="growth">
      <svg className="growth__svg" viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} aria-hidden="true" focusable="false">
        {ticks.map((value) => {
          const y = yAt(value, max, PLOT)
          return (
            <g key={value}>
              <line className="growth__grid" x1={PLOT.left} y1={y} x2={PLOT.width - PLOT.right} y2={y} />
              <text className="growth__tick" x={PLOT.left - 8} y={y + 4} textAnchor="end">
                {fmt(value)}
              </text>
            </g>
          )
        })}

        <path className="growth__band" d={bandPath(low, high, max, PLOT)} />
        <path className="growth__edge" d={linePath(low, max, PLOT)} />
        <path className="growth__edge" d={linePath(high, max, PLOT)} />
        <path className="growth__line" d={linePath(mid, max, PLOT)} />

        {points.map((p, i) => (
          <g key={p.yearOffset}>
            <circle className="growth__dot" cx={xAt(i, points.length, PLOT)} cy={yAt(p.midM, max, PLOT)} r="4" />
            <text className="growth__tick" x={xAt(i, points.length, PLOT)} y={PLOT.height - 18} textAnchor="middle">
              {p.age}
            </text>
          </g>
        ))}
        <text
          className="growth__axis"
          x={(PLOT.left + PLOT.width - PLOT.right) / 2}
          y={PLOT.height - 2}
          textAnchor="middle"
        >
          {t('proj.age')}
        </text>
      </svg>

      <figcaption className="cmp-legend">
        <span className="cmp-legend__item">
          <span className="growth__key growth__key--mid" aria-hidden="true" />
          {t('proj.legend.mid')}
        </span>
        <span className="cmp-legend__item">
          <span className="growth__key growth__key--edge" aria-hidden="true" />
          {t('proj.legend.range')}
        </span>
      </figcaption>

      <table className="visually-hidden">
        <caption>{t('proj.chart.title')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('proj.age')}</th>
            <th scope="col">{t('proj.legend.min')}</th>
            <th scope="col">{t('proj.legend.mid')}</th>
            <th scope="col">{t('proj.legend.max')}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.yearOffset}>
              <th scope="row">{p.age}</th>
              <td>{formatNumber(p.minM, locale, 1)}</td>
              <td>{formatNumber(p.midM, locale, 1)}</td>
              <td>{formatNumber(p.maxM, locale, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
