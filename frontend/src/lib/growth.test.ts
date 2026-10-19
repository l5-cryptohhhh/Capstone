import { describe, expect, it } from 'vitest'
import { axisFor, bandPath, chartAxis, linePath, xAt, yAt, type Plot } from './growth'

const plot: Plot = { width: 200, height: 100, left: 20, right: 20, top: 10, bottom: 10 }

describe('asse y', () => {
  it('usa un passo tondo e si ferma subito sopra il valore massimo', () => {
    expect(axisFor(277)).toEqual({ max: 300, ticks: [0, 100, 200, 300] })
    expect(axisFor(199.7)).toEqual({ max: 200, ticks: [0, 50, 100, 150, 200] })
    expect(axisFor(100)).toEqual({ max: 100, ticks: [0, 25, 50, 75, 100] })
    expect(axisFor(21)).toEqual({ max: 30, ticks: [0, 10, 20, 30] })
    expect(axisFor(3.2)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
  })

  it('con valori nulli o negativi usa 0-1', () => {
    expect(axisFor(0)).toEqual({ max: 1, ticks: [0, 1] })
    expect(axisFor(-5)).toEqual({ max: 1, ticks: [0, 1] })
  })

  it('non taglia mai il valore massimo', () => {
    for (const v of [0.3, 1, 7.7, 12.3, 49, 138.8, 237.9, 1000]) {
      expect(axisFor(v).max).toBeGreaterThanOrEqual(v)
    }
  })
})

describe('coordinate', () => {
  it('distribuisce i punti in orizzontale dall\'inizio alla fine dell\'area', () => {
    expect(xAt(0, 3, plot)).toBe(20)
    expect(xAt(1, 3, plot)).toBe(100)
    expect(xAt(2, 3, plot)).toBe(180)
    expect(xAt(0, 1, plot)).toBe(100)
  })

  it('il valore 0 sta in basso e il massimo in alto, oltre non si esce', () => {
    expect(yAt(0, 50, plot)).toBe(90)
    expect(yAt(50, 50, plot)).toBe(10)
    expect(yAt(25, 50, plot)).toBe(50)
    expect(yAt(80, 50, plot)).toBe(10)
    expect(yAt(-3, 50, plot)).toBe(90)
  })
})

describe('tracciati', () => {
  it('la linea tocca ogni punto', () => {
    expect(linePath([0, 50], 50, plot)).toBe('M20 90 L180 10')
  })

  it('l\'area sale sul massimo e torna sul minimo', () => {
    expect(bandPath([0, 25], [25, 50], 50, plot)).toBe('M20 50 L180 10 L180 50 L20 90 Z')
  })

  it("l'asse del grafico copre lo scenario più alto", () => {
    const points = [
      { yearOffset: 0, age: 20, minM: 10, midM: 10, maxM: 10 },
      { yearOffset: 1, age: 21, minM: 12, midM: 15, maxM: 21 },
    ]

    expect(chartAxis(points)).toEqual({ max: 30, ticks: [0, 10, 20, 30] })
  })
})
