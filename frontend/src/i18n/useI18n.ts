import { createContext, useContext } from 'react'
import type { TranslationKey } from './it'
import type { Vars } from './interpolate'
import type { Lang } from './metricLabels'

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Vars) => string
  /** Etichetta di una metrica nella lingua corrente (se sconosciuta, restituisce la chiave). */
  metricLabel: (key: string) => string
  locale: string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n deve essere usato dentro I18nProvider')
  return ctx
}
