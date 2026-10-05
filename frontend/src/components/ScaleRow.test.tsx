import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n/I18nProvider'
import { scalePosition } from '../lib/scale'
import { ScaleRow } from './ScaleRow'

function renderScale(marks: Parameters<typeof ScaleRow>[0]['marks']) {
  return render(
    <I18nProvider initialLang="it">
      <ScaleRow label="Gol per 90'" marks={marks} />
    </I18nProvider>,
  )
}

describe('ScaleRow', () => {
  it('posiziona il segno al percentile esatto', () => {
    const { container } = renderScale([{ id: 'a', percentile: 82, color: 'red', shape: 'x' }])

    const mark = container.querySelector<HTMLElement>('.scale__mark')
    expect(mark?.style.left).toBe('82%')
  })

  it('descrive il valore per le tecnologie assistive', () => {
    renderScale([{ id: 'a', percentile: 82, color: 'red', shape: 'x' }])

    expect(screen.getByRole('img')).toHaveAccessibleName("Gol per 90': 82")
  })

  it('senza percentile mostra una scala vuota e lo dichiara', () => {
    const { container } = renderScale([{ id: 'a', percentile: null, color: 'red', shape: 'x' }])

    expect(container.querySelector('.scale__mark')).toBeNull()
    expect(container.querySelector('.scale')).toHaveClass('is-empty')
    expect(screen.getByRole('img')).toHaveAccessibleName("Gol per 90': percentile non disponibile")
  })

  it('con più giocatori nomina ciascuno nella descrizione', () => {
    renderScale([
      { id: 'a', percentile: 10, color: 'red', shape: 'x', owner: 'Rossi' },
      { id: 'b', percentile: 90, color: 'blue', shape: 'circle', owner: 'Bianchi' },
    ])

    expect(screen.getByRole('img')).toHaveAccessibleName("Gol per 90': Rossi 10, Bianchi 90")
  })

  it('limita la posizione tra 0 e 100', () => {
    expect(scalePosition(-5)).toBe(0)
    expect(scalePosition(140)).toBe(100)
  })
})
