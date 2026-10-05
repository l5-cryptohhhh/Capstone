import { useState } from 'react'
import { initials } from '../lib/format'

interface Props {
  name: string
  url: string | null
  size?: 'sm' | 'md' | 'lg'
}

/** Foto del giocatore con ripiego sulle iniziali se manca o non si carica. Decorativa: il nome è sempre accanto. */
export function PlayerPhoto({ name, url, size = 'md' }: Props) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`photo photo--${size}`} aria-hidden="true">
      {url && !failed ? (
        <img src={url} alt="" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="photo__initials">{initials(name)}</span>
      )}
    </span>
  )
}
