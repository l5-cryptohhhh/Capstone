interface Item {
  label: string
  value: string
}

interface Props {
  items: Item[]
  /** colonne su desktop e su telefono */
  colsDesktop: number
  colsMobile?: number
  className?: string
}

/** Griglia a filetto di coppie etichetta/valore. Le caselle vuote completano l'ultima riga: il riquadro resta chiuso. */
export function FieldGrid({ items, colsDesktop, colsMobile = 2, className = '' }: Props) {
  const fillFor = (cols: number) => (cols - (items.length % cols)) % cols
  const fillDesktop = fillFor(colsDesktop)
  const fillMobile = fillFor(colsMobile)
  const fillers = Array.from({ length: Math.max(fillDesktop, fillMobile) }, (_, j) => j)

  return (
    <dl
      className={`fields ${className}`}
      style={{ ['--cols-d' as string]: colsDesktop, ['--cols-m' as string]: colsMobile }}
    >
      {items.map((item) => (
        <div key={item.label} className="fields__item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
      {fillers.map((j) => (
        <div
          key={`filler-${j}`}
          aria-hidden="true"
          className={`fields__item fields__item--empty${j < fillDesktop ? ' f-d' : ''}${j < fillMobile ? ' f-m' : ''}`}
        />
      ))}
    </dl>
  )
}
