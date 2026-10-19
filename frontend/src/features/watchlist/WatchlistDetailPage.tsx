import { ArrowLeft, Check, Plus } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import { useSetPlayerInWatchlist, useWatchlist } from '../../api/queries'
import type { WatchlistPlayer } from '../../api/types'
import { ErrorState } from '../../components/ErrorState'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { useI18n } from '../../i18n/useI18n'
import { formatNumber, seasonLabel } from '../../lib/format'
import { useCompare } from '../compare/useCompare'

function profileLink(p: WatchlistPlayer): string {
  return `/giocatore/${p.id}${p.season !== null ? `?season=${p.season}` : ''}`
}

/** Giocatori di una lista privata: aprire la scheda, mandare al confronto, togliere dalla lista. */
export function WatchlistDetailPage() {
  const { id } = useParams()
  const listId = Number(id)
  const { t, locale } = useI18n()
  const list = useWatchlist(listId)
  const setPlayer = useSetPlayerInWatchlist()
  const compare = useCompare()

  const toggleCompare = (p: WatchlistPlayer) =>
    compare.has(p.id) ? compare.remove(p.id) : compare.add({ id: p.id, name: p.name, photoUrl: p.photoUrl })

  return (
    <div className="page">
      <Link to="/liste" className="back">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('lists.back')}
      </Link>

      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data ? (
        <div className="skeleton skeleton--block" aria-busy="true" />
      ) : (
        <>
          <h1 className="page__title">{list.data.name}</h1>

          {setPlayer.error && <ErrorState error={setPlayer.error} />}

          {list.data.players.length === 0 ? (
            <p className="note">{t('lists.detail.empty')}</p>
          ) : (
            <ul className="wl">
              {list.data.players.map((p) => {
                const inCompare = compare.has(p.id)
                const detail = [p.team?.name, p.league?.name, p.season !== null ? seasonLabel(p.season) : null]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <li key={p.id} className="wl__item">
                    <Link to={profileLink(p)} className="wl__link">
                      <PlayerPhoto name={p.name} url={p.photoUrl} size="sm" />
                      <span className="wl__text">
                        <span className="wl__name">{p.name}</span>
                        <span className="wl__count">
                          {detail || t('lists.noSeason')}
                          {p.minutes !== null && ` · ${formatNumber(p.minutes, locale)}'`}
                        </span>
                      </span>
                    </Link>
                    <span className="wl__actions">
                      <button
                        type="button"
                        className={inCompare ? 'btn btn--on' : 'btn'}
                        aria-pressed={inCompare}
                        disabled={!inCompare && compare.isFull}
                        onClick={() => toggleCompare(p)}
                      >
                        {inCompare ? (
                          <Check size={16} weight="bold" aria-hidden="true" />
                        ) : (
                          <Plus size={16} aria-hidden="true" />
                        )}
                        {inCompare ? t('player.compare.remove') : t('player.compare.add')}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        aria-label={t('lists.remove.aria', { name: p.name })}
                        disabled={setPlayer.isPending}
                        onClick={() => setPlayer.mutate({ listId, playerId: p.id, inList: false })}
                      >
                        {t('lists.remove')}
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
