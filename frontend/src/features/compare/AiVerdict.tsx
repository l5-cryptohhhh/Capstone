import { Sparkle } from '@phosphor-icons/react'
import { useAiCompare } from '../../api/queries'
import { AiText } from '../../components/AiText'
import { ErrorState } from '../../components/ErrorState'
import { useI18n } from '../../i18n/useI18n'

/** Verdetto su richiesta: l'AI vede solo le schede dei giocatori confrontati, nella stessa stagione. */
export function AiVerdict({ ids, season }: { ids: number[]; season: number | undefined }) {
  const { t, lang } = useI18n()
  const verdict = useAiCompare(ids, season, lang)

  return (
    <section className="part ai-report" aria-labelledby="ai-verdict-title">
      <h2 id="ai-verdict-title" className="part__title">
        {t('ai.verdict.title')}
      </h2>

      {!verdict.data && <p className="note">{t('ai.verdict.intro')}</p>}

      {verdict.isError && <ErrorState error={verdict.error} onRetry={() => verdict.mutate()} />}

      {verdict.data && <AiText text={verdict.data.verdict} note={t('ai.verdict.note')} />}

      <button type="button" className="btn" disabled={verdict.isPending} onClick={() => verdict.mutate()}>
        <Sparkle size={16} aria-hidden="true" />
        {verdict.isPending
          ? t('ai.verdict.busy')
          : verdict.data
            ? t('ai.report.regenerate')
            : t('ai.verdict.generate')}
      </button>
    </section>
  )
}
