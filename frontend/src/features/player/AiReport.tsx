import { Sparkle } from '@phosphor-icons/react'
import { useAiReport } from '../../api/queries'
import { AiText } from '../../components/AiText'
import { ErrorState } from '../../components/ErrorState'
import { useI18n } from '../../i18n/useI18n'

/** Report su richiesta: il testo dell'AI sta in un riquadro a parte, mai confuso con i dati della scheda. */
export function AiReport({ playerId }: { playerId: number }) {
  const { t, lang } = useI18n()
  const report = useAiReport(playerId, lang)

  return (
    <section className="part ai-report" aria-labelledby="ai-report-title">
      <h2 id="ai-report-title" className="part__title">
        {t('ai.report.title')}
      </h2>

      {!report.data && <p className="note">{t('ai.report.intro')}</p>}

      {report.isError && <ErrorState error={report.error} onRetry={() => report.mutate()} />}

      {report.data && <AiText text={report.data.report} note={t('ai.report.note')} />}

      <button type="button" className="btn" disabled={report.isPending} onClick={() => report.mutate()}>
        <Sparkle size={16} aria-hidden="true" />
        {report.isPending ? t('ai.report.busy') : report.data ? t('ai.report.regenerate') : t('ai.report.generate')}
      </button>
    </section>
  )
}
