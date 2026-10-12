import { Link } from 'react-router-dom'
import { useSimilarPlayers } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { useI18n } from '../../i18n/useI18n'
import { formatNumber } from '../../lib/format'

/** Profili statisticamente vicini (stesso ruolo e stagione). Calcolo sui dati: nessuna AI. */
export function SimilarPlayers({ playerId, season }: { playerId: number; season: number }) {
  const { t, locale } = useI18n()
  const similar = useSimilarPlayers(playerId, season)

  return (
    <section className="part" aria-labelledby="similar-title">
      <h2 id="similar-title" className="part__title">
        {t('similar.title')}
      </h2>

      {similar.isError ? (
        <ErrorState error={similar.error} onRetry={() => similar.refetch()} />
      ) : !similar.data ? (
        <div className="skeleton skeleton--block" aria-busy="true" />
      ) : similar.data.length === 0 ? (
        <p className="note">{t('similar.empty')}</p>
      ) : (
        <>
          <p className="note">{t('similar.note')}</p>
          <ul className="similar">
            {similar.data.map((p) => (
              <li key={p.id}>
                <Link to={`/giocatore/${p.id}?season=${p.season}`} className="similar__item">
                  <PlayerPhoto name={p.name} url={p.photoUrl} size="sm" />
                  <span className="similar__text">
                    <span className="similar__name">{p.name}</span>
                    <span className="similar__sub">
                      {p.team.name} · {p.league.name}
                      {p.minutes !== null && ` · ${formatNumber(p.minutes, locale)}'`}
                    </span>
                  </span>
                  <span className="similar__score" title={t('similar.metrics', { n: p.commonMetrics })}>
                    {t('similar.score', { n: p.similarity })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
