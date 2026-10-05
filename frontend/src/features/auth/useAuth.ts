import { createContext, useContext } from 'react'

export interface User {
  id: number
  email: string
  displayName: string
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
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
