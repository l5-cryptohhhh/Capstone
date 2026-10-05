import { ApiError } from '../api/client'
import type { TranslationKey } from '../i18n/it'

const KNOWN_CODES = ['NETWORK', 'PLAYER_NOT_FOUND', 'LEAGUE_NOT_FOUND', 'INVALID_REQUEST', 'DATABASE_ERROR'] as const

/** Chiave di traduzione del messaggio per un errore (per codice stabile del backend). */
export function errorKey(error: unknown): TranslationKey {
  const code = error instanceof ApiError ? error.code : 'UNKNOWN'
  return (KNOWN_CODES as readonly string[]).includes(code) ? (`error.${code}` as TranslationKey) : 'error.UNKNOWN'
}
