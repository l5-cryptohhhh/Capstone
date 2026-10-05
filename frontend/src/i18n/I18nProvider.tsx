import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './en'
import { it, type TranslationKey } from './it'
import { interpolate } from './interpolate'
import { METRIC_LABELS, type Lang } from './metricLabels'
import { I18nContext, type I18nValue } from './useI18n'

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { it, en }
const STORAGE_KEY = 'scoutai.lang'

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'it' || stored === 'en') return stored
  } catch {
    // storage non disponibile: si usa il default
  }
  return 'it'
}

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // la preferenza resta valida per la sessione
    }
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      locale: lang === 'it' ? 'it-IT' : 'en-GB',
      t: (key, vars) => interpolate(DICTIONARIES[lang][key] ?? it[key], vars),
      metricLabel: (key) => METRIC_LABELS[lang][key] ?? key,
    }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
