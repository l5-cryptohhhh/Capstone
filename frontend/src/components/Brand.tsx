/** Simbolo di Scout AI: una S inclinata, tracciata con un solo segno. Prende il colore dal testo che lo contiene. */
export function BrandMark({ className = 'wordmark__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M35 12H20.5a6.5 6.5 0 0 0 0 13H28a6.5 6.5 0 0 1 0 13H12"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="skewX(-10) translate(5 0)"
      />
    </svg>
  )
}

/** Marchio completo: simbolo, "Scout" in inchiostro e "AI" in verde. */
export function Wordmark() {
  return (
    <>
      <BrandMark />
      <span>
        Scout <span className="wordmark__ai">AI</span>
      </span>
    </>
  )
}
