import { createContext, useContext } from 'react'

export interface User {
  id: number
  email: string
  displayName: string
  bio: string | null
  location: string | null
  favoriteTeam: string | null
  favoritePosition: 'GK' | 'DEF' | 'MID' | 'ATT' | null
  /** Percorso della foto (con la versione nell'indirizzo), o null se non ne ha una */
  avatarUrl: string | null
  /** ISO 8601 */
  createdAt: string | null
}

export interface AuthValue {
  user: User | null
  /** True finché non si sa se il token salvato è ancora valido. */
  loading: boolean
  /** Il visitatore ha scelto di esplorare senza account (solo per questa sessione del browser). */
  guest: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string) => Promise<void>
  logout: () => Promise<void>
  continueAsGuest: () => void
  /** Aggiorna l'utente dopo una modifica del profilo (il backend restituisce l'utente aggiornato). */
  updateUser: (user: User) => void
  /** Dopo l'eliminazione dell'account: chiude la sessione in locale senza chiamare il backend. */
  closeAccount: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
