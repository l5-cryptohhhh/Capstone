import { describe, expect, it } from 'vitest'
import { countryName } from './countries'

describe('countryName', () => {
  it('traduce nella lingua dell\'interfaccia', () => {
    expect(countryName('Germany', 'it')).toBe('Germania')
    expect(countryName('Germany', 'en')).toBe('Germany')
    expect(countryName('Netherlands', 'it')).toBe('Paesi Bassi')
  })

  it('gestisce le nazioni del Regno Unito', () => {
    expect(countryName('England', 'it')).toBe('Inghilterra')
    expect(countryName('Wales', 'it')).toBe('Galles')
  })

  it('lascia il nome della fonte se non lo conosce, e null se manca', () => {
    expect(countryName('Atlantide', 'it')).toBe('Atlantide')
    expect(countryName(null, 'it')).toBeNull()
  })
})
