import { useI18n } from '../i18n/useI18n'
import type { TranslationKey } from '../i18n/it'
import type { ZoneScore } from '../lib/zones'

const W = 200
const H = 280

const ZONE_KEY: Record<ZoneScore['id'], TranslationKey> = {
  attack: 'zone.attack',
  build: 'zone.build',
  defense: 'zone.defense',
  goal: 'zone.goal',
}

/** Fasce orizzontali (y, altezza) per zona: tre zone sono i terzi del campo, per il portiere c'è la sola area. */
function bands(zones: ZoneScore[]): { y: number; h: number }[] {
  if (zones.length === 1) return [{ y: H - 90, h: 90 }]
  const h = H / zones.length
  return zones.map((_, i) => ({ y: i * h, h }))
}

/**
 * Campo (attacco in alto) con ogni zona colorata dalla media dei percentili. Il numero è sempre scritto nella zona:
 * il colore da solo non basta. Non mostra posizioni reali, solo il profilo statistico per fase di gioco.
 */
export function ZoneMap({
  zones,
  color = 'var(--mark-1)',
  name,
}: {
  zones: ZoneScore[]
  color?: string
  name: string
}) {
  const { t } = useI18n()
  const na = t('player.stamp.metric')
  const layout = bands(zones)
  const description = `${name}: ${zones.map((z) => `${t(ZONE_KEY[z.id])} ${z.score ?? na}`).join(', ')}`

  return (
    <svg className="zonemap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={description}>
      <rect className="zonemap__pitch" x="1" y="1" width={W - 2} height={H - 2} rx="6" />

      {zones.map((z, i) => (
        <rect
          key={z.id}
          className={z.score === null ? 'zonemap__band is-empty' : 'zonemap__band'}
          x="1"
          y={layout[i].y + 1}
          width={W - 2}
          height={layout[i].h - 2}
          fill={color}
          fillOpacity={z.score === null ? 0 : 0.08 + (0.55 * z.score) / 100}
        />
      ))}

      <g className="zonemap__lines" aria-hidden="true">
        <line x1="1" y1={H / 2} x2={W - 1} y2={H / 2} />
        <circle cx={W / 2} cy={H / 2} r="26" />
        <rect x="45" y="1" width="110" height="46" />
        <rect x="45" y={H - 47} width="110" height="46" />
        <rect x="72" y="1" width="56" height="18" />
        <rect x="72" y={H - 19} width="56" height="18" />
      </g>

      {zones.map((z, i) => (
        <text key={z.id} className="zonemap__text" x={W / 2} y={layout[i].y + layout[i].h / 2} textAnchor="middle">
          <tspan className="zonemap__score" x={W / 2} dy="0">
            {z.score ?? na}
          </tspan>
          <tspan className="zonemap__zone" x={W / 2} dy="15">
            {t(ZONE_KEY[z.id])}
          </tspan>
        </text>
      ))}
    </svg>
  )
}
