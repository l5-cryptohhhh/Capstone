import { Link } from 'react-router-dom'
import { useProjection } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { GrowthChart } from '../../components/GrowthChart'
import { Stamp } from '../../components/Stamp'
import { useI18n } from '../../i18n/useI18n'
import { formatNumber, seasonLabel } from '../../lib/format'
import { MIN_MINUTES_FOR_PERCENTILES } from './helpers'

/** Stima euristica del valore e traiettoria di crescita: sempre etichettata come stima, mai come dato. */
export function ProjectionPanel({ playerId, season }: { playerId: number; season: number }) {
  const { t, locale } = useI18n()
  const projection = useProjection(playerId, season)
  const data = projection.data

  return (
    <section className="part" aria-labelledby="proj-title">
      <h2 id="proj-title" className="part__title">
        {t('proj.title')}
      </h2>

      {projection.isError ? (
        <ErrorState error={projection.error} onRetry={() => projection.refetch()} />
      ) : !data ? (
        <div className="skeleton skeleton--block" aria-busy="true" />
      ) : !data.available ? (
        <Stamp title={t('proj.unavailable')}>
          {t(`proj.reason.${data.reason ?? 'NO_SEASON'}`, { min: MIN_MINUTES_FOR_PERCENTILES })}
        </Stamp>
      ) : (
        <>
          <p className="proj__value">
            <span className="proj__number">{formatNumber(data.currentValueM, locale, 1)} M€</span>
            <span className="proj__badge">{t('proj.badge')}</span>
          </p>
          <p className="note">
            {t('proj.basis', {
              score: formatNumber(data.score, locale, 0),
              season: seasonLabel(data.season ?? season),
            })}
          </p>

          <h3 className="group__title">{t('proj.chart.title')}</h3>
          <GrowthChart points={data.points} />

          <p className="note">{t('proj.note')}</p>
          <Link to="/metodo" className="save__manage">
            {t('proj.method')}
          </Link>
        </>
      )}
    </section>
  )
}
