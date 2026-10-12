import { Sparkle } from '@phosphor-icons/react'
import { useAiReport } from '../../api/queries'
import { ErrorState } from '../../components/ErrorState'
import { useI18n } from '../../i18n/useI18n'

/** Il testo dell'AI sta in un riquadro a parte con un'etichetta: non va mai confuso con i dati della scheda. */
export function AiReport({ playerId }: { playerId: number }) {
  const { t } = useI18n()
  const report = useAiReport(playerId)
  const paragraphs = (report.data?.report ?? '')
    // il modello a volte usa markdown (**grassetto**, # titoli): qui il testo è semplice
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <section className="part ai-report" aria-labelledby="ai-report-title">
      <h2 id="ai-report-title" className="part__title">
        {t('ai.report.title')}
      </h2>

      {!report.data && <p className="note">{t('ai.report.intro')}</p>}

      {report.isError && <ErrorState error={report.error} onRetry={() => report.mutate()} />}

      {report.data ? (
        <article className="ai-report__body" aria-live="polite">
          <p className="ai-report__badge">
            <Sparkle size={14} weight="fill" aria-hidden="true" /> {t('ai.report.badge')}
          </p>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="ai-report__note">{t('ai.report.note')}</p>
        </article>
      ) : null}

      <button type="button" className="btn" disabled={report.isPending} onClick={() => report.mutate()}>
        <Sparkle size={16} aria-hidden="true" />
        {report.isPending ? t('ai.report.busy') : report.data ? t('ai.report.regenerate') : t('ai.report.generate')}
      </button>
    </section>
  )
}
