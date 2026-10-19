import { useI18n } from '../../i18n/useI18n'
import type { TranslationKey } from '../../i18n/it'

const SECTIONS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'method.source.title', body: 'method.source.body' },
  { title: 'method.per90.title', body: 'method.per90.body' },
  { title: 'method.percentile.title', body: 'method.percentile.body' },
  { title: 'method.visibility.title', body: 'method.visibility.body' },
  { title: 'method.similar.title', body: 'method.similar.body' },
  { title: 'method.ai.title', body: 'method.ai.body' },
  { title: 'method.match.title', body: 'method.match.body' },
  { title: 'method.account.title', body: 'method.account.body' },
]

/** Pagina di lettura: dichiara da dove vengono i dati e cosa non possono dire. */
export function MethodPage() {
  const { t } = useI18n()
  return (
    <article className="page page--read">
      <h1 className="page__title">{t('method.title')}</h1>
      <p className="lead">{t('method.lead')}</p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="read-part">
          <h2 className="part__title">{t(section.title)}</h2>
          <p>{t(section.body)}</p>
        </section>
      ))}
    </article>
  )
}
