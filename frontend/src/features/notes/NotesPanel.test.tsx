import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { NotesPanel } from './NotesPanel'

const addMutate = vi.fn()
const updateMutate = vi.fn()
const deleteMutate = vi.fn()
let notes: { id: number; playerId: number; body: string; createdAt: string; updatedAt: string }[] = []

vi.mock('../../api/queries', () => ({
  usePlayerNotes: () => ({ data: notes, isError: false, error: null, refetch: vi.fn() }),
  useAddNote: () => ({ mutate: addMutate, isPending: false, isError: false, error: null }),
  useUpdateNote: () => ({ mutate: updateMutate, isPending: false, isError: false, error: null }),
  useDeleteNote: () => ({ mutate: deleteMutate, isPending: false, isError: false, error: null }),
}))

function renderPanel() {
  return render(
    <I18nProvider initialLang="it">
      <NotesPanel playerId={10} />
    </I18nProvider>,
  )
}

const note = (id: number, body: string, updated = false) => ({
  id,
  playerId: 10,
  body,
  createdAt: '2026-10-19T10:00:00Z',
  updatedAt: updated ? '2026-10-19T11:00:00Z' : '2026-10-19T10:00:00Z',
})

describe('NotesPanel', () => {
  beforeEach(() => {
    notes = []
    addMutate.mockReset()
    updateMutate.mockReset()
    deleteMutate.mockReset()
  })

  it('senza note lo dice e non permette di salvare un testo vuoto', () => {
    renderPanel()

    expect(screen.getByText('Non hai ancora scritto note su questo giocatore.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aggiungi nota' })).toBeDisabled()
  })

  it('invia il testo scritto e svuota il campo', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.type(screen.getByLabelText('Nuova nota'), '  Gran dribbling  ')
    await user.click(screen.getByRole('button', { name: 'Aggiungi nota' }))

    expect(addMutate).toHaveBeenCalledWith('Gran dribbling', expect.any(Object))
  })

  it('mostra le note e segnala quelle modificate', () => {
    notes = [note(1, 'Prima nota'), note(2, 'Seconda nota', true)]
    renderPanel()

    expect(screen.getByText('Prima nota')).toBeInTheDocument()
    expect(screen.getAllByText(/modificata/)).toHaveLength(1)
  })

  it('modifica una nota sul posto', async () => {
    const user = userEvent.setup()
    notes = [note(1, 'Vecchio testo')]
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Modifica' }))
    const field = screen.getByRole('textbox', { name: 'Modifica' })
    await user.clear(field)
    await user.type(field, 'Nuovo testo')
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    expect(updateMutate).toHaveBeenCalledWith({ id: 1, body: 'Nuovo testo' }, expect.any(Object))
  })

  it('elimina solo dopo la conferma', async () => {
    const user = userEvent.setup()
    notes = [note(1, 'Da togliere')]
    renderPanel()

    await user.click(screen.getByRole('button', { name: 'Elimina' }))
    expect(deleteMutate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Elimina davvero' }))
    expect(deleteMutate).toHaveBeenCalledWith(1, expect.any(Object))
  })
})
