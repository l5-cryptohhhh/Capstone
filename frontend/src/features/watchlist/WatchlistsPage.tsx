import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreateWatchlist, useDeleteWatchlist, useWatchlists } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { useI18n } from '../../i18n/useI18n'
import { NewListForm } from './NewListForm'

/** Elenco delle liste private dell'utente, con creazione ed eliminazione. */
export function WatchlistsPage() {
  const { t } = useI18n()
  const lists = useWatchlists()
  const create = useCreateWatchlist()
  const remove = useDeleteWatchlist()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  const mutationError = create.error ?? remove.error

  return (
    <div className="page">
      <h1 className="page__title">{t('lists.title')}</h1>
      <p className="note">{t('lists.intro')}</p>

      <NewListForm
        id="lists-new"
        label={t('lists.new.label')}
        actionLabel={t('lists.new.create')}
        pending={create.isPending}
        onSubmit={(name, done) => create.mutate(name, { onSuccess: done })}
      />

      {mutationError && <ErrorState error={mutationError} />}

      {lists.isError ? (
        <ErrorState error={lists.error} onRetry={() => lists.refetch()} />
      ) : !lists.data ? (
        <div className="skeleton skeleton--block" aria-busy="true" />
      ) : lists.data.length === 0 ? (
        <p className="note">{t('lists.empty')}</p>
      ) : (
        <ul className="wl">
          {lists.data.map((list) => (
            <li key={list.id} className="wl__item">
              <Link to={`/liste/${list.id}`} className="wl__link">
                <span className="wl__name">{list.name}</span>
                <span className="wl__count">{t('lists.count', { n: list.playerCount })}</span>
              </Link>
              {confirmingId === list.id ? (
                <button
                  type="button"
                  className="btn btn--on"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(list.id, { onSuccess: () => setConfirmingId(null) })}
                >
                  {t('lists.delete.confirm')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  aria-label={t('lists.delete.aria', { name: list.name })}
                  onClick={() => setConfirmingId(list.id)}
                >
                  {t('lists.delete')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
