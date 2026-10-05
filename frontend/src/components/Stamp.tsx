import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

/** Timbro rosso: segnala uno stato incerto (dati mancanti, campione piccolo) invece di lasciare un vuoto. */
export function Stamp({ title, children }: Props) {
  return (
    <aside className="stamp" role="note">
      <p className="stamp__title">{title}</p>
      <p className="stamp__body">{children}</p>
    </aside>
  )
}
