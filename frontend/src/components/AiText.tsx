import { Sparkle } from '@phosphor-icons/react'
import Markdown from 'react-markdown'
import { useI18n } from '../i18n/useI18n'

/** Testo scritto dall'AI (Markdown): sempre in un riquadro a parte con etichetta, mai confuso con i dati. */
export function AiText({ text, note }: { text: string; note: string }) {
  const { t } = useI18n()

  return (
    <article className="ai-report__body" aria-live="polite">
      <p className="ai-report__badge">
        <Sparkle size={14} aria-hidden="true" /> {t('ai.report.badge')}
      </p>
      <div className="ai-md">
        {/* titoli # ridotti a ### per non rompere la gerarchia della pagina; niente HTML grezzo */}
        <Markdown
          components={{
            h1: 'h3',
            h2: 'h3',
            h3: 'h3',
            h4: 'h4',
            h5: 'h4',
            h6: 'h4',
          }}
        >
          {text}
        </Markdown>
      </div>
      <p className="ai-report__note">{note}</p>
    </article>
  )
}
