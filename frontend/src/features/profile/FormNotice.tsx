export type Notice = { tone: 'ok' | 'error'; text: string } | null

/** Messaggio sotto un modulo: conferma o errore, annunciato dai lettori di schermo. */
export function FormNotice({ notice }: { notice: Notice }) {
  if (!notice) return null
  return (
    <p className={`profile__notice profile__notice--${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
      {notice.text}
    </p>
  )
}
