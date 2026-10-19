import { BookmarkSimple } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCreateWatchlist, useSetPlayerInWatchlist, useWatchlists } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { useI18n } from '../../i18n/useI18n'
import { NewListForm } from './NewListForm'

/** Menu della scheda giocatore per mettere o togliere il giocatore dalle liste private dell'utente. */
export function SaveToList({ playerId, children }: { playerId: number; children?: ReactNode }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const lists = useWatchlists(playerId)
  const toggle = useSetPlayerInWatchlist()
  const create = useCreateWatchlist()
  const saved = lists.data?.filter((l) => l.contains).length ?? 0
  const error = lists.error ?? toggle.error ?? create.error

  const createAndAdd = (name: string, done: () => void) =>
    create.mutate(name, {
      onSuccess: (list) => {
        toggle.mutate({ listId: list.id, playerId, inList: true })
        done()
      },
    })

  return (
    <div className="save">
      <div className="save__bar">
        <button
          type="button"
          className={saved > 0 ? 'btn btn--on' : 'btn'}
          aria-expanded={open}
          aria-controls="save-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <BookmarkSimple size={16} weight={saved > 0 ? 'fill' : 'regular'} aria-hidden="true" />
          {t('save.button')}
          {saved > 0 && <span className="count">{saved}</span>}
        </button>
        {children}
      </div>

      {open && (
        <div id="save-panel" className="save__panel">
          <h2 className="save__title">{t('save.title')}</h2>

          {lists.data && lists.data.length === 0 && <p className="note">{t('save.none')}</p>}

          {lists.data && lists.data.length > 0 && (
            <ul className="save__lists">
              {lists.data.map((l) => (
                <li key={l.id}>
                  <label className="save__item">
                    <input
                      type="checkbox"
                      checked={l.contains}
                      disabled={toggle.isPending}
                      onChange={(e) => toggle.mutate({ listId: l.id, playerId, inList: e.target.checked })}
                    />
                    <span>{l.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <NewListForm
            id="save-new"
            label={t('save.new.label')}
            actionLabel={t('save.new.add')}
            pending={create.isPending}
            onSubmit={createAndAdd}
          />

          {error && <ErrorState error={error} />}

          <Link to="/liste" className="save__manage">
            {t('save.manage')}
          </Link>
        </div>
      )}
    </div>
  )
}
