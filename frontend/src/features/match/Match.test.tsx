import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import type { Fielder } from './engine'
import { Match } from './MatchView'

const f = (id: number, level: number): Fielder => ({
  id,
  name: `Giocatore ${id}`,
  photoUrl: null,
  position: 'MID',
  att: level,
  def: level,
})

describe('Match', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout'] }))
  afterEach(() => vi.useRealTimers())

  it('dura 1 minuto reale: a 90\' compare il risultato finale, non prima', () => {
    render(
      <I18nProvider initialLang="it">
        <Match
          home={[f(1, 80), f(2, 80), f(3, 80)]}
          away={[f(4, 30), f(5, 30), f(6, 30)]}
          keepers={{ home: f(7, 60), away: f(8, 60) }}
          onRematch={() => {}}
          onNew={() => {}}
          onClose={() => {}}
        />
      </I18nProvider>,
    )

    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(screen.getByText(/^\d+'$/).textContent).toBe("45'")
    expect(screen.queryByText('Fischio finale')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(29_500)
    })
    expect(screen.queryByText('Fischio finale')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(screen.getByText('Fischio finale')).toBeTruthy()
    expect(screen.getByText("90'")).toBeTruthy()
  })
})
