import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Projection } from '../../api/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { ProjectionPanel } from './ProjectionPanel'

let projection: Projection | undefined

vi.mock('../../api/queries', () => ({
  useProjection: () => ({ data: projection, isError: false, error: null, refetch: vi.fn() }),
}))

function renderPanel() {
  return render(
    <I18nProvider initialLang="it">
      <MemoryRouter>
        <ProjectionPanel playerId={10} season={2024} />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const available: Projection = {
  available: true,
  reason: null,
  season: 2024,
  age: 20,
  score: 70,
  currentValueM: 12.3,
  points: [
    { yearOffset: 0, age: 20, minM: 12.3, midM: 12.3, maxM: 12.3 },
    { yearOffset: 1, age: 21, minM: 12, midM: 15, maxM: 18 },
    { yearOffset: 2, age: 22, minM: 11, midM: 17, maxM: 24 },
  ],
}

describe('ProjectionPanel', () => {
  beforeEach(() => {
    projection = undefined
  })

  it('il numero è sempre accompagnato dall\'etichetta Stima e dall\'avvertenza', () => {
    projection = available
    renderPanel()

    expect(screen.getByText('12,3 M€')).toBeInTheDocument()
    expect(screen.getByText('Stima')).toBeInTheDocument()
    expect(screen.getByText(/non è un valore di mercato/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Come si calcola' })).toHaveAttribute('href', '/metodo')
  })

  it('la tabella accessibile ha minimo, medio e massimo per ogni età', () => {
    projection = available
    renderPanel()

    const row = screen.getByRole('row', { name: /^22/ })
    expect(within(row).getByText('11,0')).toBeInTheDocument()
    expect(within(row).getByText('17,0')).toBeInTheDocument()
    expect(within(row).getByText('24,0')).toBeInTheDocument()
  })

  it.each([
    ['MINUTES', /Minuti insufficienti: servono almeno 450/],
    ['PERCENTILES', /Percentili insufficienti/],
    ['NO_AGE', /Manca la data di nascita/],
    ['NO_SEASON', /non ha stagioni/],
  ] as const)('senza dati spiega perché (%s) e non mostra numeri', (reason, text) => {
    projection = { available: false, reason, season: 2024, age: null, score: null, currentValueM: null, points: [] }
    renderPanel()

    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.queryByText(/M€/)).not.toBeInTheDocument()
  })
})
