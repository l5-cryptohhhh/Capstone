import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n/I18nProvider'
import { Radar } from './Radar'

const axes = [
  { key: 'a', label: "Gol per 90'" },
  { key: 'b', label: "Passaggi chiave per 90'" },
  { key: 'c', label: 'Duelli vinti %' },
  { key: 'd', label: 'Valutazione media' },
]

function renderRadar(series: Parameters<typeof Radar>[0]['series']) {
  return render(
    <I18nProvider initialLang="it">
      <Radar axes={axes} series={series} />
    </I18nProvider>,
  )
}

describe('Radar', () => {
  it('disegna un contorno per giocatore e un segno per ogni percentile noto', () => {
    const { container } = renderRadar([
      { id: '1', name: 'Rossi', color: 'red', shape: 'x', values: [80, 60, 40, 90] },
    ])

    expect(container.querySelectorAll('svg.radar__svg path[fill-opacity]')).toHaveLength(1)
    expect(container.querySelectorAll('svg.radar__svg path[stroke-linecap]')).toHaveLength(4)
  })

  it('un percentile mancante lascia l\'asse vuoto e la tabella lo dichiara', () => {
    const { container } = renderRadar([
      { id: '1', name: 'Rossi', color: 'red', shape: 'x', values: [80, null, 40, 90] },
    ])

    expect(container.querySelectorAll('svg.radar__svg path[stroke-linecap]')).toHaveLength(3)
    const row = screen.getByRole('row', { name: /Passaggi chiave per 90'/ })
    expect(within(row).getByText('n/d')).toBeInTheDocument()
  })

  it('la tabella accessibile ha i numeri di ogni giocatore e la legenda compare solo con più giocatori', () => {
    renderRadar([
      { id: '1', name: 'Rossi', color: 'red', shape: 'x', values: [80, 60, 40, 90] },
      { id: '2', name: 'Bianchi', color: 'blue', shape: 'circle', values: [10, 20, 30, 40] },
    ])

    const row = screen.getByRole('row', { name: /Gol per 90'/ })
    expect(within(row).getByText('80')).toBeInTheDocument()
    expect(within(row).getByText('10')).toBeInTheDocument()
    expect(screen.getAllByText('Bianchi').length).toBeGreaterThan(1)
  })

  it('con un solo giocatore non mostra la legenda', () => {
    const { container } = renderRadar([{ id: '1', name: 'Rossi', color: 'red', shape: 'x', values: [1, 2, 3, 4] }])

    expect(container.querySelector('figcaption')).toBeNull()
  })
})
