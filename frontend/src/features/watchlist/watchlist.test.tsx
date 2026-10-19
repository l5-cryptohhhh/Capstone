import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { SaveToList } from './SaveToList'
import { WatchlistsPage } from './WatchlistsPage'

const toggleMutate = vi.fn()
const createMutate = vi.fn()
const deleteMutate = vi.fn()
let lists: { id: number; name: string; playerCount: number; contains: boolean }[] = []

const idle = { isPending: false, error: null }

vi.mock('../../api/queries', () => ({
  useWatchlists: () => ({ data: lists, isError: false, error: null, refetch: vi.fn() }),
  useSetPlayerInWatchlist: () => ({ ...idle, mutate: toggleMutate }),
  useCreateWatchlist: () => ({ ...idle, mutate: createMutate }),
  useDeleteWatchlist: () => ({ ...idle, mutate: deleteMutate }),
}))

function renderInRouter(ui: React.ReactNode) {
  return render(
    <I18nProvider initialLang="it">
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nProvider>,
  )
}

describe('SaveToList', () => {
  beforeEach(() => {
    lists = []
    toggleMutate.mockReset()
    createMutate.mockReset()
    deleteMutate.mockReset()
  })

  it('apre il menu e, senza liste, invita a crearne una', async () => {
    const user = userEvent.setup()
    renderInRouter(<SaveToList playerId={10} />)

    expect(screen.queryByText('Le tue liste')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salva in lista' }))

    expect(screen.getByText('Non hai ancora liste: creane una qui sotto.')).toBeInTheDocument()
  })

  it('mostra in quali liste c\'è già il giocatore e le cambia', async () => {
    const user = userEvent.setup()
    lists = [
      { id: 1, name: 'Portieri', playerCount: 1, contains: true },
      { id: 2, name: 'Terzini', playerCount: 0, contains: false },
    ]
    renderInRouter(<SaveToList playerId={10} />)
    await user.click(screen.getByRole('button', { name: /Salva in lista/ }))

    expect(screen.getByRole('checkbox', { name: 'Portieri' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Terzini' })).not.toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Terzini' }))
    expect(toggleMutate).toHaveBeenCalledWith({ listId: 2, playerId: 10, inList: true })

    await user.click(screen.getByRole('checkbox', { name: 'Portieri' }))
    expect(toggleMutate).toHaveBeenCalledWith({ listId: 1, playerId: 10, inList: false })
  })

  it('crea una lista nuova con il nome scritto', async () => {
    const user = userEvent.setup()
    renderInRouter(<SaveToList playerId={10} />)
    await user.click(screen.getByRole('button', { name: 'Salva in lista' }))

    expect(screen.getByRole('button', { name: 'Crea e aggiungi' })).toBeDisabled()
    await user.type(screen.getByLabelText('Nuova lista'), '  Talenti  ')
    await user.click(screen.getByRole('button', { name: 'Crea e aggiungi' }))

    expect(createMutate).toHaveBeenCalledWith('Talenti', expect.any(Object))
  })
})

describe('WatchlistsPage', () => {
  beforeEach(() => {
    lists = []
    createMutate.mockReset()
    deleteMutate.mockReset()
  })

  it('senza liste lo dice', () => {
    renderInRouter(<WatchlistsPage />)

    expect(screen.getByText('Non hai ancora nessuna lista.')).toBeInTheDocument()
  })

  it('mostra le liste con il numero di giocatori e porta al dettaglio', () => {
    lists = [{ id: 3, name: 'Under 21', playerCount: 4, contains: false }]
    renderInRouter(<WatchlistsPage />)

    expect(screen.getByRole('link', { name: /Under 21/ })).toHaveAttribute('href', '/liste/3')
    expect(screen.getByText('Giocatori: 4')).toBeInTheDocument()
  })

  it('elimina una lista solo dopo la conferma', async () => {
    const user = userEvent.setup()
    lists = [{ id: 3, name: 'Under 21', playerCount: 4, contains: false }]
    renderInRouter(<WatchlistsPage />)

    await user.click(screen.getByRole('button', { name: 'Elimina la lista Under 21' }))
    expect(deleteMutate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Elimina davvero' }))
    expect(deleteMutate).toHaveBeenCalledWith(3, expect.any(Object))
  })
})
