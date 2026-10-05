import { useI18n } from '../i18n/I18nProvider'
import { errorKey } from '../lib/errors'
import { StateMessage } from './StateMessage'

/** Errore di caricamento con messaggio per codice e azione di recupero. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <StateMessage
      tone="error"
      title={t('error.title')}
      action={
        onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            {t('error.retry')}
          </button>
        )
      }
    >
      {t(errorKey(error))}
    </StateMessage>
  )
}
