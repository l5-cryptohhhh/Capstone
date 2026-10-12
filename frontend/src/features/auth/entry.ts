/**
 * Segnale tra la pagina di accesso e la cornice dell'app: chi arriva dall'accesso entra con una dissolvenza dal
 * fondo (la stessa con cui finisce la transizione del pallone), non con un taglio netto.
 */
let entering = false

export function markEntering(value: boolean): void {
  entering = value
}

/** Lettura pura: la cornice azzera il segnale quando la dissolvenza è finita. */
export function isEntering(): boolean {
  return entering
}
