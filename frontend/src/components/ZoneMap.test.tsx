import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n/I18nProvider'
import { ZoneMap } from './ZoneMap'

function renderMap(zones: Parameters<typeof ZoneMap>[0]['zones']) {
  return render(
    <I18nProvider initialLang="it">
      <ZoneMap zones={zones} name="Rossi" />
    </I18nProvider>,
  )
}

describe('ZoneMap', () => {
  it('descrive ogni zona con il suo punteggio per le tecnologie assistive', () => {
    renderMap([
      { id: 'attack', score: 80, count: 3 },
      { id: 'build', score: 55, count: 2 },
      { id: 'defense', score: null, count: 1 },
    ])

    expect(screen.getByRole('img')).toHaveAccessibleName('Rossi: Attacco 80, Costruzione 55, Difesa n/d')
  })

  it('scrive il numero nella zona e lascia vuota quella senza dati', () => {
    const { container } = renderMap([
      { id: 'attack', score: 80, count: 3 },
      { id: 'build', score: null, count: 0 },
      { id: 'defense', score: 20, count: 3 },
    ])

    expect(container.querySelectorAll('.zonemap__score')).toHaveLength(3)
    expect(container.querySelectorAll('.zonemap__band.is-empty')).toHaveLength(1)
    expect(container.querySelector('.zonemap__band.is-empty')).toHaveAttribute('fill-opacity', '0')
  })

  it('più alto è il punteggio più la zona è intensa', () => {
    const { container } = renderMap([
      { id: 'attack', score: 100, count: 3 },
      { id: 'build', score: 0, count: 3 },
      { id: 'defense', score: 50, count: 3 },
    ])
    const opacity = (i: number) => Number(container.querySelectorAll('.zonemap__band')[i].getAttribute('fill-opacity'))

    expect(opacity(0)).toBeGreaterThan(opacity(2))
    expect(opacity(2)).toBeGreaterThan(opacity(1))
  })

  it('il portiere ha una sola zona, la porta', () => {
    renderMap([{ id: 'goal', score: 70, count: 2 }])

    expect(screen.getByRole('img')).toHaveAccessibleName('Rossi: Porta 70')
  })
})
