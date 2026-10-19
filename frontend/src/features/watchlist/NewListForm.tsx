import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface Props {
  id: string
  label: string
  actionLabel: string
  pending: boolean
  /** Chiamata col nome ripulito; done svuota il campo (da usare solo se la lista è stata creata davvero). */
  onSubmit: (name: string, done: () => void) => void
}

/** Campo e pulsante per creare una lista: lo stesso nella scheda giocatore e nella pagina delle liste. */
export function NewListForm({ id, label, actionLabel, pending, onSubmit }: Props) {
  const { t } = useI18n()
  const [name, setName] = useState('')

  const submit = () => {
    const clean = name.trim()
    if (clean) onSubmit(clean, () => setName(''))
  }

  return (
    <div className="save__new">
      <label htmlFor={id} className="notes__label">
        {label}
      </label>
      <div className="save__row">
        <input
          id={id}
          className="notes__input"
          maxLength={80}
          value={name}
          placeholder={t('lists.new.placeholder')}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button type="button" className="btn" disabled={!name.trim() || pending} onClick={submit}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
