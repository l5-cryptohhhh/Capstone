import { useState } from 'react'
import { useAddNote, useDeleteNote, usePlayerNotes, useUpdateNote } from '../../api/queries'
import type { PlayerNote } from '../../api/types'
import { ErrorState } from '../../components/ErrorState'
import { useI18n } from '../../i18n/useI18n'
import { formatDate } from '../../lib/format'

const MAX_LENGTH = 2000

/** Note private dell'utente sulla scheda: solo lui le vede, restano nel database. */
export function NotesPanel({ playerId }: { playerId: number }) {
  const { t, locale } = useI18n()
  const notes = usePlayerNotes(playerId)
  const add = useAddNote(playerId)
  const update = useUpdateNote(playerId)
  const remove = useDeleteNote(playerId)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  const submit = () => {
    const body = draft.trim()
    if (!body) return
    add.mutate(body, { onSuccess: () => setDraft('') })
  }

  const startEdit = (note: PlayerNote) => {
    setEditingId(note.id)
    setEditDraft(note.body)
    setConfirmingId(null)
  }

  const saveEdit = () => {
    const body = editDraft.trim()
    if (editingId === null || !body) return
    update.mutate({ id: editingId, body }, { onSuccess: () => setEditingId(null) })
  }

  const mutationError = add.error ?? update.error ?? remove.error

  return (
    <section className="part notes" aria-labelledby="notes-title">
      <h2 id="notes-title" className="part__title">
        {t('notes.title')}
      </h2>
      <p className="note">{t('notes.intro')}</p>

      <div className="notes__new">
        <label htmlFor="notes-new" className="notes__label">
          {t('notes.label')}
        </label>
        <textarea
          id="notes-new"
          className="notes__input"
          rows={3}
          maxLength={MAX_LENGTH}
          placeholder={t('notes.placeholder')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="notes__row">
          <span className="notes__count">{t('notes.count', { n: draft.length })}</span>
          <button type="button" className="btn" disabled={!draft.trim() || add.isPending} onClick={submit}>
            {add.isPending ? t('notes.adding') : t('notes.add')}
          </button>
        </div>
      </div>

      {mutationError && <ErrorState error={mutationError} />}

      {notes.isError ? (
        <ErrorState error={notes.error} onRetry={() => notes.refetch()} />
      ) : !notes.data ? (
        <div className="skeleton skeleton--block" aria-busy="true" />
      ) : notes.data.length === 0 ? (
        <p className="note">{t('notes.empty')}</p>
      ) : (
        <ul className="notes__list">
          {notes.data.map((note) => (
            <li key={note.id} className="notes__item">
              {editingId === note.id ? (
                <>
                  <label htmlFor={`note-edit-${note.id}`} className="notes__label">
                    {t('notes.edit')}
                  </label>
                  <textarea
                    id={`note-edit-${note.id}`}
                    className="notes__input"
                    rows={3}
                    maxLength={MAX_LENGTH}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                  <div className="notes__row">
                    <span className="notes__count">{t('notes.count', { n: editDraft.length })}</span>
                    <span className="notes__actions">
                      <button type="button" className="btn" onClick={() => setEditingId(null)}>
                        {t('notes.cancel')}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={!editDraft.trim() || update.isPending}
                        onClick={saveEdit}
                      >
                        {t('notes.save')}
                      </button>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="notes__body">{note.body}</p>
                  <div className="notes__row">
                    <span className="notes__meta">
                      {formatDate(note.createdAt, locale)}
                      {note.updatedAt !== note.createdAt && ` · ${t('notes.edited')}`}
                    </span>
                    <span className="notes__actions">
                      <button type="button" className="btn" onClick={() => startEdit(note)}>
                        {t('notes.edit')}
                      </button>
                      {confirmingId === note.id ? (
                        <button
                          type="button"
                          className="btn btn--on"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(note.id, { onSuccess: () => setConfirmingId(null) })}
                        >
                          {t('notes.delete.confirm')}
                        </button>
                      ) : (
                        <button type="button" className="btn" onClick={() => setConfirmingId(note.id)}>
                          {t('notes.delete')}
                        </button>
                      )}
                    </span>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
