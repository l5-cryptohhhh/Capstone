import { describe, expect, it } from 'vitest'
import { pdfFileName, pdfSafe } from './pdfText'

describe('pdfSafe', () => {
  it('lascia intatte le lettere accentate e i simboli che il PDF sa disegnare', () => {
    expect(pdfSafe("Età · Gyökeres · 12,3 M€ · l'anno")).toBe("Età · Gyökeres · 12,3 M€ · l'anno")
  })

  it('toglie gli accenti dalle lettere fuori dal set standard', () => {
    expect(pdfSafe('Pulišić')).toBe('Pulišic')
    expect(pdfSafe('Modrić')).toBe('Modric')
    expect(pdfSafe('Łukasz')).toBe('Lukasz')
    expect(pdfSafe('Đorđe')).toBe('Dorde')
  })

  it('sostituisce con ? ciò che non è una lettera riconducibile', () => {
    expect(pdfSafe('Мбаппе')).toBe('??????')
    expect(pdfSafe('a🙂b')).toBe('a?b')
  })

  it('tiene gli a capo e trasforma le tabulazioni in spazi', () => {
    expect(pdfSafe('riga 1\nriga 2\tfine')).toBe('riga 1\nriga 2 fine')
  })
})

describe('pdfFileName', () => {
  it('fa un nome file senza spazi né accenti', () => {
    expect(pdfFileName('Lamine Yamal', 2024)).toBe('scout-ai-lamine-yamal-2024.pdf')
    expect(pdfFileName('Dušan Vlahović', 2023)).toBe('scout-ai-dusan-vlahovic-2023.pdf')
  })

  it('senza stagione la omette e con un nome vuoto ripiega su giocatore', () => {
    expect(pdfFileName('M. Svilar', null)).toBe('scout-ai-m-svilar.pdf')
    expect(pdfFileName('???', 2024)).toBe('scout-ai-giocatore-2024.pdf')
  })
})
