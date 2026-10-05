import type { ApiErrorBody } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

/** Errore dell'API con il codice stabile del backend (es. PLAYER_NOT_FOUND), oppure NETWORK se il server non risponde. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export async function apiGet<T>(path: string, params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = params && params.size > 0 ? `?${params.toString()}` : ''
  let response: Response
  try {
    response = await fetch(`${BASE}${path}${query}`, { signal, headers: { Accept: 'application/json' } })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('NETWORK', 0, 'Backend non raggiungibile')
  }

  if (!response.ok) {
    let body: Partial<ApiErrorBody> = {}
    try {
      body = (await response.json()) as Partial<ApiErrorBody>
    } catch {
      // risposta non JSON (es. errore del proxy): si usa lo status
    }
    throw new ApiError(body.code ?? 'UNKNOWN', response.status, body.message ?? response.statusText)
  }
  return (await response.json()) as T
}
