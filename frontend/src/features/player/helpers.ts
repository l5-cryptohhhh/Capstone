import type { MetricValue } from '../../api/types'
import { formatNumber } from '../../lib/format'

/** Soglie del backend (scoutai.stats): sotto questi valori i percentili non vengono calcolati. */
export const MIN_MINUTES_FOR_PERCENTILES = 450
export const MIN_COHORT = 10

export function formatMetricValue(m: MetricValue, locale: string): string {
  const text = formatNumber(m.value, locale, 2)
  return m.unit === 'PERCENT' ? `${text}%` : text
}
