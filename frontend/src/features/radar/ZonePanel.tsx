import { ZoneMap } from '../../components/ZoneMap'
import { Stamp } from '../../components/Stamp'
import { useI18n } from '../../i18n/useI18n'
import { zoneScores } from '../../lib/zones'
import { SLOTS } from '../compare/helpers'
import type { RadarPlayer } from './RadarPanel'

/** Mappa per zone di uno o più giocatori (affiancate, non sovrapposte). Nessun dato di posizione reale. */
export function ZonePanel({ players, titleId }: { players: RadarPlayer[]; titleId: string }) {
  const { t } = useI18n()
  const maps = players.map((p, i) => ({
    ...p,
    color: SLOTS[i % SLOTS.length].color,
    zones: zoneScores(p.entry?.metrics ?? [], p.entry?.position ?? null),
  }))
  const enough = maps.some((m) => m.zones.some((z) => z.score !== null))

  return (
    <section className="part" aria-labelledby={titleId}>
      <h2 id={titleId} className="part__title">
        {t('zone.title')}
      </h2>
      {enough ? (
        <>
          <p className="note">{t('zone.note')}</p>
          <div className="zones">
            {maps.map((m) => (
              <figure key={m.id} className="zones__item">
                <ZoneMap zones={m.zones} color={m.color} name={m.name} />
                {maps.length > 1 && <figcaption className="zones__name">{m.name}</figcaption>}
              </figure>
            ))}
          </div>
        </>
      ) : (
        <Stamp title={t('player.stamp.title')}>{t('zone.insufficient')}</Stamp>
      )}
    </section>
  )
}
