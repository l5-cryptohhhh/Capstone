import type { AiFilters } from '../../api/types'
import type { TranslationKey } from '../../i18n/it'
import type { Vars } from '../../i18n/interpolate'
import { seasonLabel } from '../../lib/format'

type Translate = (key: TranslationKey, vars?: Vars) => string

const SORTS = ['rating', 'goals', 'assists', 'minutes', 'appearances']

/** I filtri che l'AI ha ricavato dalla frase, come etichette leggibili: l'utente vede cosa è stato capito. */
export function aiChips(f: AiFilters, t: Translate): string[] {
  const chips: string[] = []
  const text = (value: string | null) => (value && value.trim() ? value.trim() : null)

  const name = text(f.name)
  if (name) chips.push(t('ai.chip.name', { value: name }))
  if (f.position) chips.push(t('ai.chip.position', { value: t(`position.${f.position}`) }))
  const team = text(f.team)
  if (team) chips.push(t('ai.chip.team', { value: team }))
  const league = text(f.league)
  if (league) chips.push(t('ai.chip.league', { value: league }))
  if (f.season !== null) chips.push(t('ai.chip.season', { value: seasonLabel(f.season) }))
  if (f.minAge !== null) chips.push(t('ai.chip.minAge', { value: f.minAge }))
  if (f.maxAge !== null) chips.push(t('ai.chip.maxAge', { value: f.maxAge }))
  if (f.minMinutes !== null) chips.push(t('ai.chip.minMinutes', { value: f.minMinutes }))
  if (f.sort && SORTS.includes(f.sort)) {
    chips.push(t('ai.chip.sort', { value: t(`ai.sort.${f.sort}` as TranslationKey) }))
  }
  return chips
}
