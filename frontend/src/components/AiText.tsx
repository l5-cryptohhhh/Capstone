import { Sparkle } from '@phosphor-icons/react'
import { useI18n } from '../i18n/useI18n'

/** Testo scritto dall'AI: sempre in un riquadro a parte con etichetta, mai confuso con i dati. */
export function AiText({ text, note }: { text: string; note: string }) {
  const { t } = useI18n()
  const paragraphs = text
    // il modello a volte usa markdown (**grassetto**, # titoli): qui il testo è semplice
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <article className="ai-report__body" aria-live="polite">
      <p className="ai-report__badge">
        <Sparkle size={14} aria-hidden="true" /> {t('ai.report.badge')}
      </p>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <p className="ai-report__note">{note}</p>
    </article>
  )
}
