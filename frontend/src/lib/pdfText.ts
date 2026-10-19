// Caratteri oltre il Latin-1 che i font standard del PDF (WinAnsi) sanno disegnare
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

// Lettere senza scomposizione in lettera + accento: la corrispondenza più vicina
const LOOKALIKE: Record<string, string> = { ł: 'l', Ł: 'L', đ: 'd', Đ: 'D', ı: 'i', İ: 'I', ħ: 'h', Ħ: 'H' }

/**
 * Rende un testo disegnabile con i font standard del PDF: tiene ciò che sanno scrivere, toglie gli accenti
 * dagli altri caratteri (ć diventa c) e sostituisce con "?" ciò che non si può ricondurre a una lettera.
 * Senza questo, un nome come "Pulišić" uscirebbe con simboli illeggibili.
 */
export function pdfSafe(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    if (code === 10) {
      out += ch
    } else if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(ch)) {
      out += ch
    } else if (LOOKALIKE[ch]) {
      out += LOOKALIKE[ch]
    } else {
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
      out += base !== ch && /^[\x20-\x7e]+$/.test(base) ? base : code === 9 ? ' ' : '?'
    }
  }
  return out
}

/** Nome file leggibile: "Lamine Yamal" e 2024 diventano scout-ai-lamine-yamal-2024.pdf. */
export function pdfFileName(playerName: string, season: number | null): string {
  const slug = pdfSafe(playerName)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `scout-ai-${slug || 'giocatore'}${season === null ? '' : `-${season}`}.pdf`
}
