import { useState } from 'react'
import { assetUrl } from '../api/client'
import { initials } from '../lib/format'

interface Props {
  name: string
  /** Percorso della foto restituito dal backend, o null */
  url: string | null
  size?: 'xs' | 'md' | 'xl'
}

/** Foto profilo rotonda con ripiego sulle iniziali. Decorativa: il nome è sempre accanto. */
export function Avatar({ name, url, size = 'md' }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = url !== null && failedUrl !== url
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {showImage ? (
        <img src={assetUrl(url)} alt="" decoding="async" onError={() => setFailedUrl(url)} />
      ) : (
        <span className="avatar__initials">{initials(name)}</span>
      )}
    </span>
  )
}
