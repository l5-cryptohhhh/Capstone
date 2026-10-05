import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CompareContext, type CompareEntry, type CompareValue } from './useCompare'

const MAX_COMPARE = 3
const STORAGE_KEY = 'scoutai.compare'

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
