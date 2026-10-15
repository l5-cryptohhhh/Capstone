/** Lato della foto profilo dopo il ridimensionamento. */
const AVATAR_SIZE = 256
/** Limite oltre il quale il backend rifiuta la foto. */
const AVATAR_MAX_BYTES = 256 * 1024
/** Foto di partenza accettate dal selettore: più grandi di così non si caricano nemmeno. */
export const AVATAR_SOURCE_MAX_BYTES = 12 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface CropRect {
  sx: number
  sy: number
  size: number
}

/** Quadrato centrato più grande possibile dentro un'immagine w x h. */
export function squareCrop(width: number, height: number): CropRect {
  const size = Math.min(width, height)
  return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size }
}

type Strength = 0 | 1 | 2 | 3 | 4

/** Robustezza indicativa di una password: lunghezza e varietà di caratteri (0 = troppo corta). */
export function passwordStrength(password: string): Strength {
  if (password.length < 8) return 0
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  let score = 1
  if (classes >= 2) score++
  if (password.length >= 12) score++
  if (classes >= 3 && password.length >= 10) score++
  return Math.min(score, 4) as Strength
}

/** Dimensione leggibile (es. "212 KB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Ritaglia al centro e riduce la foto a un quadrato AVATAR_SIZE, in JPEG. Prova qualità decrescenti finché sta
 * nel limite del backend.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const { sx, sy, size } = squareCrop(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas non disponibile')
    // Fondo bianco: i PNG trasparenti non diventano neri passando a JPEG
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
    for (const quality of [0.9, 0.8, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= AVATAR_MAX_BYTES) return blob
    }
    throw new Error('immagine troppo pesante')
  } finally {
    bitmap.close()
  }
}
