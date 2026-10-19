import type { SeasonEntry } from '../../api/types'
import { Radar } from '../../components/Radar'
import { Stamp } from '../../components/Stamp'
import { useI18n } from '../../i18n/useI18n'
import { radarAxisKeys, radarValues } from '../../lib/radarAxes'
import { SLOTS } from '../compare/helpers'

/** Meno di 3 percentili non descrivono un profilo: al loro posto un timbro che spiega perché. */
const MIN_AXES = 3

export interface RadarPlayer {
  id: string
  name: string
  entry: SeasonEntry | undefined
}

/** Sezione radar per uno o più giocatori (gli assi sono quelli del ruolo del primo che ne ha uno). */
export function RadarPanel({ players, titleId }: { players: RadarPlayer[]; titleId: string }) {
  const { t, metricLabel } = useI18n()
  const position = players.map((p) => p.entry?.position ?? null).find((pos) => pos !== null) ?? null
  const keys = radarAxisKeys(position)
  const series = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    color: SLOTS[i % SLOTS.length].color,
    shape: SLOTS[i % SLOTS.length].shape,
    values: radarValues(keys, p.entry?.metrics ?? []),
  }))
  const enough = series.some((s) => s.values.filter((v) => v !== null).length >= MIN_AXES)

  return (
    <section className="part" aria-labelledby={titleId}>
      <h2 id={titleId} className="part__title">
        {t('radar.title')}
      </h2>
      {enough ? (
        <>
          <p className="note">{t('radar.note')}</p>
          <Radar axes={keys.map((key) => ({ key, label: metricLabel(key) }))} series={series} />
        </>
      ) : (
        <Stamp title={t('player.stamp.title')}>{t('radar.insufficient', { n: MIN_AXES })}</Stamp>
      )}
    </section>
  )
}
