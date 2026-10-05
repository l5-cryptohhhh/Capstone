import type { ReactNode } from 'react'

interface Props {
  tone: 'empty' | 'error'
  title: string
  children?: ReactNode
  action?: ReactNode
}

/** Stato vuoto o di errore: dice cosa è successo e come proseguire. */
export function StateMessage({ tone, title, children, action }: Props) {
  return (
    <div className={`state state--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <h2 className="state__title">{title}</h2>
      {children && <p className="state__body">{children}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  )
}
