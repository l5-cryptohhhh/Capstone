/** Testo con la parola chiave tra asterischi, resa come <em> (nel brand l'enfasi è il verde, non il corsivo). */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*([^*]+)\*/g).map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part))}
    </>
  )
}
