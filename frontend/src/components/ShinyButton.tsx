import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  className?: string
}

/** Bottone con bordo luminoso animato (stile 21st.dev), nel verde del sito. Usato solo per la Partitella. */
export function ShinyButton({ children, onClick, disabled, title, className = '' }: Props) {
  return (
    <button type="button" className={`shiny-cta ${className}`.trim()} onClick={onClick} disabled={disabled} title={title}>
      <span>{children}</span>
    </button>
  )
}
