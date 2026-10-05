import { createContext, useContext } from 'react'

export interface CompareEntry {
  id: number
  name: string
  photoUrl: string | null
}

export interface CompareValue {
  entries: CompareEntry[]
  has: (id: number) => boolean
  isFull: boolean
  add: (entry: CompareEntry) => boolean
  remove: (id: number) => void
  clear: () => void
}

export const CompareContext = createContext<CompareValue | null>(null)

export function useCompare(): CompareValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare deve essere usato dentro CompareProvider')
  return ctx
}
