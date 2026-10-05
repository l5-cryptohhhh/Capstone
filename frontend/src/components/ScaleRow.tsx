import { useI18n } from '../i18n/I18nProvider'
import { scalePosition } from '../lib/scale'

export type MarkShape = 'x' | 'circle' | 'square'

export interface ScaleMark {
  id: string
  /** 0-100, null se il percentile non è disponibile */
  percentile: number | null
  /** colore del marcatore (variabile CSS, es. var(--mark-1)) */
  color: string
  shape: MarkShape
  /** nome del giocatore a cui appartiene il marcatore (per la descrizione accessibile) */
  owner?: string
}

interface Props {
  label: string
  marks: ScaleMark[]
  /** indice di partenza per l'ordine di comparsa dei segni */
  order?: number
  /** versione ridotta per le tabelle */
  compact?: boolean
}

export function MarkGlyph({ shape, color }: { shape: MarkShape; color: string }) {
  return (
    <svg className="scale__glyph" viewBox="-8 -8 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      {shape === 'circle' && <circle className="scale__stroke" pathLength={1} r="5.5" fill="none" stroke={color} strokeWidth="2.4" />}
      {shape === 'square' && <rect className="scale__stroke" pathLength={1} x="-5" y="-5" width="10" height="10" fill="none" stroke={color} strokeWidth="2.4" />}
      {shape === 'x' && (
        <path
          className="scale__stroke"
          d="M-5 -5 L5 5 M5 -5 L-5 5"
          pathLength={1}
          stroke={color}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  )
}

/**
 * Riga di scala 0-100 del dossier: un tratto con tacche ogni 10 e il segno (X, cerchio o quadrato)
 * posto al percentile esatto. Con più segni confronta più giocatori sulla stessa scala.
 */
export function ScaleRow({ label, marks, order = 0, compact = false }: Props) {
  const { t } = useI18n()
  const known = marks.filter((m) => m.percentile !== null)

  const description =
    known.length === 0
      ? t('player.scale.none', { metric: label })
      : `${label}: ${marks
          .map((m) => {
            const text = m.percentile === null ? t('player.stamp.metric') : String(Math.round(m.percentile))
            return m.owner ? `${m.owner} ${text}` : text
          })
          .join(', ')}`

  return (
    <div
      className={`scale${known.length === 0 ? ' is-empty' : ''}${compact ? ' scale--compact' : ''}`}
      role="img"
      aria-label={description}
    >
      <div className="scale__track" aria-hidden="true">
        <span className="scale__ticks" />
        <span className="scale__tick scale__tick--0" />
        <span className="scale__tick scale__tick--50" />
        <span className="scale__tick scale__tick--100" />
        {known.map((mark, index) => (
          <span
            key={mark.id}
            className="scale__mark"
            style={{ left: `${scalePosition(mark.percentile as number)}%`, ['--i' as string]: order + index }}
          >
            <MarkGlyph shape={mark.shape} color={mark.color} />
          </span>
        ))}
      </div>
    </div>
  )
}
