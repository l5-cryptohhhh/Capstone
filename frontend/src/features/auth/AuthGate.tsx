import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Rimanda alla pagina di accesso, ricordando dove l'utente voleva andare. */
function toLogin(from: string) {
  return <Navigate to="/accesso" replace state={{ from }} />
}

/** Pagina iniziale: serve l'accesso oppure la scelta esplicita di esplorare da ospite. */
export function EntryGate({ children }: { children: ReactNode }) {
  const { user, guest, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  return user || guest ? children : toLogin(location.pathname + location.search)
}

/** Schede e confronto: solo per gli utenti registrati. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  return user ? children : toLogin(location.pathname + location.search)
}
