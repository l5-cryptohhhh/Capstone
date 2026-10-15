import { describe, expect, it } from 'vitest'
import { formatBytes, passwordStrength, squareCrop } from './helpers'

describe('squareCrop', () => {
  it('ritaglia al centro un\'immagine orizzontale', () => {
    expect(squareCrop(400, 200)).toEqual({ sx: 100, sy: 0, size: 200 })
  })

  it('ritaglia al centro un\'immagine verticale', () => {
    expect(squareCrop(150, 300)).toEqual({ sx: 0, sy: 75, size: 150 })
  })

  it('lascia intatta un\'immagine già quadrata', () => {
    expect(squareCrop(256, 256)).toEqual({ sx: 0, sy: 0, size: 256 })
  })
})

describe('passwordStrength', () => {
  it('sotto gli 8 caratteri è troppo corta', () => {
    expect(passwordStrength('abc123')).toBe(0)
  })

  it('cresce con lunghezza e varietà', () => {
    const weak = passwordStrength('abcdefgh')
    const medium = passwordStrength('abcdefgh12')
    const strong = passwordStrength('Abcdefgh12!?xyz')
    expect(weak).toBeLessThan(medium)
    expect(medium).toBeLessThanOrEqual(strong)
    expect(strong).toBe(4)
  })
})

describe('formatBytes', () => {
  it('usa l\'unità adatta', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(212 * 1024)).toBe('212 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})
