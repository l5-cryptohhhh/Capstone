import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, SESSION_EXPIRED_EVENT, apiGet, apiPost, getToken, setToken } from '../../api/client'
import { AuthContext, type AuthValue, type User } from './useAuth'

const GUEST_KEY = 'scoutai.guest'

interface AuthResponse {
  token: string
  user: User
}

function readGuest(): boolean {
  try {
    return sessionStorage.getItem(GUEST_KEY) === '1'
  } catch {
    return false
  }
}

function writeGuest(value: boolean) {
  try {
    if (value) sessionStorage.setItem(GUEST_KEY, '1')
    else sessionStorage.removeItem(GUEST_KEY)
  } catch {
    // la scelta vale solo finché la pagina resta aperta
  }
}

/** Sessione dell'utente: il token sta nel browser e il backend lo verifica a ogni richiesta. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => getToken() !== null)
  const [guest, setGuest] = useState(readGuest)

  useEffect(() => {
    if (!getToken()) return
    apiGet<User>('/auth/me')
      .then(setUser)
      .catch((error) => {
        // Token non valido: lo scarta il client. Se invece il server non risponde lo teniamo per dopo.
        if (!(error instanceof ApiError && error.status === 401)) return
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const start = useCallback(
    (response: AuthResponse) => {
      setToken(response.token)
      writeGuest(false)
      setGuest(false)
      setUser(response.user)
      // I risultati già in cache erano quelli del visitatore (con le righe bloccate)
      void queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      guest,
      login: async (email, password) => start(await apiPost<AuthResponse>('/auth/login', { email, password })),
      register: async (email, displayName, password) =>
        start(await apiPost<AuthResponse>('/auth/register', { email, displayName, password })),
      logout: async () => {
        await apiPost<void>('/auth/logout').catch(() => undefined)
        setToken(null)
        setUser(null)
        queryClient.clear()
      },
      continueAsGuest: () => {
        writeGuest(true)
        setGuest(true)
      },
    }),
    [user, loading, guest, start, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
