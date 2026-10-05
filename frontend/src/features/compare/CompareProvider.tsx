import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export const MAX_COMPARE = 3
const STORAGE_KEY = 'scoutai.compare'

export interface CompareEntry {
  id: number
  name: string
  photoUrl: string | null
}

interface CompareValue {
  entries: CompareEntry[]
  has: (id: number) => boolean
  isFull: boolean
  add: (entry: CompareEntry) => boolean
  remove: (id: number) => void
  clear: () => void
}

const CompareContext = createContext<CompareValue | null>(null)

function load(): CompareEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e): e is CompareEntry => typeof e?.id === 'number' && typeof e?.name === 'string')
      .slice(0, MAX_COMPARE)
  } catch {
    return []
  }
}

function save(entries: CompareEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // il confronto resta valido per la sessione
  }
}

/** Giocatori selezionati per il confronto (max 3), conservati nel browser. */
export function CompareProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CompareEntry[]>(load)

  const update = useCallback((next: CompareEntry[]) => {
    setEntries(next)
    save(next)
  }, [])

  const add = useCallback(
    (entry: CompareEntry) => {
      if (entries.some((e) => e.id === entry.id)) return true
      if (entries.length >= MAX_COMPARE) return false
      update([...entries, entry])
      return true
    },
    [entries, update],
  )

  const remove = useCallback((id: number) => update(entries.filter((e) => e.id !== id)), [entries, update])
  const clear = useCallback(() => update([]), [update])

  const value = useMemo<CompareValue>(
    () => ({
      entries,
      has: (id) => entries.some((e) => e.id === id),
      isFull: entries.length >= MAX_COMPARE,
      add,
      remove,
      clear,
    }),
    [entries, add, remove, clear],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare deve essere usato dentro CompareProvider')
  return ctx
}
