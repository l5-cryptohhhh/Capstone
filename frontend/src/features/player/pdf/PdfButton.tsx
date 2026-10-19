import { DownloadSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { usePlayerNotes, useProjection } from '../../../api/queries'
import type { PlayerDetail, SeasonEntry } from '../../../api/types'
import { useI18n } from '../../../i18n/useI18n'
import { pdfFileName } from '../../../lib/pdfText'

/** Scarica la scheda della stagione mostrata in PDF. Il generatore si carica solo al clic, per non pesare sul sito. */
export function PdfButton({ player, entry }: { player: PlayerDetail; entry: SeasonEntry }) {
  const { t, metricLabel, locale, lang } = useI18n()
  const notes = usePlayerNotes(player.id)
  const projection = useProjection(player.id, entry.season)
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle')

  const download = async () => {
    setState('busy')
    try {
      const { buildPlayerPdf } = await import('./buildPlayerPdf')
      const doc = await buildPlayerPdf({
        t,
        metricLabel,
        locale,
        lang,
        player,
        entry,
        projection: projection.data ?? null,
        notes: notes.data ?? [],
      })
      doc.save(pdfFileName(player.name, entry.season))
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn"
        disabled={state === 'busy' || notes.isPending || projection.isPending}
        onClick={() => void download()}
      >
        <DownloadSimple size={16} aria-hidden="true" />
        {state === 'busy' ? t('pdf.busy') : t('pdf.button')}
      </button>
      {state === 'error' && (
        <p className="note" role="alert">
          {t('pdf.error')}
        </p>
      )}
    </>
  )
}
