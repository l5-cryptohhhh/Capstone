import { useI18n } from '../../i18n/I18nProvider'
import type { TranslationKey } from '../../i18n/it'

const SECTIONS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'method.source.title', body: 'method.source.body' },
  { title: 'method.per90.title', body: 'method.per90.body' },
  { title: 'method.percentile.title', body: 'method.percentile.body' },
  { title: 'method.limits.title', body: 'method.limits.body' },
  { title: 'method.seasons.title', body: 'method.seasons.body' },
  { title: 'method.ai.title', body: 'method.ai.body' },
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
