import type { ApiErrorBody } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'
const TOKEN_KEY = 'scoutai.token'

/** Evento lanciato quando il backend rifiuta il token salvato (sessione scaduta o revocata). */
export const SESSION_EXPIRED_EVENT = 'scoutai:session-expired'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage non disponibile: la sessione dura finché la pagina resta aperta
  }
}

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

async function request<T>(path: string, init: RequestInit, query?: URLSearchParams): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const suffix = query && query.size > 0 ? `?${query.toString()}` : ''
  let response: Response
  try {
    response = await fetch(`${BASE}${path}${suffix}`, { ...init, headers })
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
    // Un 401 con un token inviato significa sessione scaduta (il login sbagliato non invia token)
    if (response.status === 401 && token) {
      setToken(null)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw new ApiError(body.code ?? 'UNKNOWN', response.status, body.message ?? response.statusText)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function apiGet<T>(path: string, params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { signal }, params)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
}
