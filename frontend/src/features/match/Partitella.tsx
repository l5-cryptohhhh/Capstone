import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePlayers, usePlayersByIds } from '../../api/queries'
import type { PlayerDetail, PlayerSummary, Position } from '../../api/types'
import { PlayerPhoto } from '../../components/PlayerPhoto'
import { useI18n } from '../../i18n/useI18n'
import { seasonLabel } from '../../lib/format'
import { SLOTS } from '../compare/helpers'
import { fielderFrom } from './engine'
import { Match } from './MatchView'

const SQUAD = 3
const KEEPERS = 2

interface Props {
  yours: PlayerDetail[]
  season: number | undefined
  onClose: () => void
}

type Step = 'opponents' | 'keepers' | 'match'

/** Schermata a tutto campo: scelta degli avversari, scelta dei portieri, poi si guarda la partita. */
export function Partitella({ yours, season, onClose }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('opponents')
  const [opponents, setOpponents] = useState<PlayerSummary[]>([])
  const [keepers, setKeepers] = useState<PlayerSummary[]>([])
  const [round, setRound] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const yoursCards = yours.map((p, i) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, ring: SLOTS[i].color }))
  const theirsCards = opponents.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }))

  return createPortal(
    <div className="match" role="dialog" aria-modal="true" aria-label={t('match.title')} ref={dialogRef} tabIndex={-1}>
      <header className="match__bar">
        <h2 className="match__title">{t('match.title')}</h2>
        <button type="button" className="icon-btn" aria-label={t('match.close')} onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      {step === 'opponents' && (
        <Picker
          key="opponents"
          groups={[{ title: t('match.yours'), players: yoursCards }]}
          slotsTitle={t('match.theirs')}
          slotLabels={[]}
          needed={SQUAD}
          heading={t('match.pick.title')}
          body={t('match.pick.body')}
          season={season}
          blocked={new Set(yours.map((p) => p.id))}
          chosen={opponents}
          onChange={setOpponents}
          actionLabel={t('match.next')}
          onAction={() => setStep('keepers')}
        />
      )}

      {step === 'keepers' && (
        <Picker
          key="keepers"
          groups={[
            { title: t('match.yours'), players: yoursCards },
            { title: t('match.theirs'), players: theirsCards },
          ]}
          slotsTitle={t('match.keepers')}
          slotLabels={[t('match.slot.yourKeeper'), t('match.slot.theirKeeper')]}
          needed={KEEPERS}
          position="GK"
          heading={t('match.keepers.title')}
          body={t('match.keepers.body')}
          season={season}
          blocked={new Set([...yours.map((p) => p.id), ...opponents.map((p) => p.id)])}
          chosen={keepers}
          onChange={setKeepers}
          actionLabel={t('match.kickoff')}
          onAction={() => setStep('match')}
          onBack={() => setStep('opponents')}
        />
      )}

      {step === 'match' && (
        <MatchLoader
          key={round}
          yours={yours}
          opponentIds={opponents.map((o) => o.id)}
          keeperIds={keepers.map((k) => k.id)}
          season={season}
          onRematch={() => setRound((r) => r + 1)}
          onNew={() => {
            setStep('opponents')
            setOpponents([])
            setKeepers([])
          }}
          onClose={onClose}
        />
      )}
    </div>,
    document.body,
  )
}

interface Card {
  id: number
  name: string
  photoUrl: string | null
  ring?: string
}

function Picker({
  groups,
  slotsTitle,
  slotLabels,
  needed,
  position,
  heading,
  body,
  season,
  blocked,
  chosen,
  onChange,
  actionLabel,
  onAction,
  onBack,
}: {
  /** giocatori già fissati, mostrati a sinistra */
  groups: { title: string; players: Card[] }[]
  slotsTitle: string
  /** etichetta di ogni posto, nell'ordine di scelta (opzionale) */
  slotLabels: string[]
  needed: number
  position?: Position
  heading: string
  body: string
  season: number | undefined
  /** già in campo: non si possono scegliere */
  blocked: Set<number>
  chosen: PlayerSummary[]
  onChange: (next: PlayerSummary[]) => void
  actionLabel: string
  onAction: () => void
  onBack?: () => void
}) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(id)
  }, [q])

  const params = useMemo(() => {
    const p = new URLSearchParams({ sort: 'rating', order: 'desc', page: '0', size: '24' })
    if (debounced) p.set('q', debounced)
    if (season !== undefined) p.set('season', String(season))
    if (position) p.set('position', position)
    return p
  }, [debounced, season, position])
  const results = usePlayers(params)

  const taken = new Set([...blocked, ...chosen.map((p) => p.id)])
  const full = chosen.length >= needed
  const rows = (results.data?.content ?? []).filter((r): r is PlayerSummary => !r.locked)

  return (
    <div className="match__body match__pick">
      <section className="match__squads" aria-label={heading}>
        {groups.map((group) => (
          <div key={group.title} className="match__squad">
            <h3 className="match__squad-title">{group.title}</h3>
            <ul className="match__slots">
              {group.players.map((p) => (
                <li key={p.id} className="match__slot is-set" style={{ ['--ring' as string]: p.ring }}>
                  <PlayerPhoto name={p.name} url={p.photoUrl} size="sm" />
                  <span className="match__slot-name">{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="match__squad">
          <h3 className="match__squad-title">{slotsTitle}</h3>
          <ul className="match__slots">
            {Array.from({ length: needed }, (_, i) => {
              const p = chosen[i]
              const label = slotLabels[i]
              return p ? (
                <li key={p.id} className="match__slot is-set">
                  <PlayerPhoto name={p.name} url={p.photoUrl} size="sm" />
                  <span className="match__slot-text">
                    {label && <span className="match__slot-label">{label}</span>}
                    <span className="match__slot-name">{p.name}</span>
                  </span>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    aria-label={t('compare.remove', { name: p.name })}
                    onClick={() => onChange(chosen.filter((c) => c.id !== p.id))}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ) : (
                <li key={`empty-${i}`} className="match__slot">
                  <span className="match__slot-name">{label ?? t('match.slot.empty')}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="match__actions">
          <button type="button" className="btn btn--primary match__start" disabled={!full} onClick={onAction}>
            {actionLabel}
          </button>
          {onBack && (
            <button type="button" className="btn btn--quiet" onClick={onBack}>
              {t('match.back')}
            </button>
          )}
        </div>
      </section>

      <section className="match__search">
        <h3 className="match__squad-title">{heading}</h3>
        <p className="note">{body}</p>
        <label className="match__field">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('match.search')}
            aria-label={t('match.search')}
          />
        </label>
        {results.isError ? (
          <p className="note">{t('error.UNKNOWN')}</p>
        ) : (
          <ul key={`${debounced}:${season ?? ''}`} className="match__results" aria-busy={results.isFetching}>
            {rows.map((r) => {
              const isTaken = taken.has(r.id)
              const inPlay = blocked.has(r.id)
              return (
                <li key={r.id} className="match__row">
                  <PlayerPhoto name={r.name} url={r.photoUrl} size="sm" />
                  <span className="match__row-text">
                    <span className="match__row-name">{r.name}</span>
                    <span className="match__row-meta">
                      {r.team.name} · {t(r.position ? `position.${r.position}` : 'player.stamp.metric')}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    disabled={isTaken || full}
                    onClick={() => onChange([...chosen, r])}
                  >
                    {inPlay ? (
                      t('match.inPlay')
                    ) : isTaken ? (
                      t('match.taken')
                    ) : (
                      <>
                        <Plus size={14} aria-hidden="true" />
                        {t('match.add')}
                      </>
                    )}
                  </button>
                </li>
              )
            })}
            {!results.isFetching && rows.length === 0 && <li className="note">{t('results.empty.title')}</li>}
          </ul>
        )}
        {season !== undefined && <p className="note">{t('results.season', { season: seasonLabel(season) })}</p>}
      </section>
    </div>
  )
}

function MatchLoader({
  yours,
  opponentIds,
  keeperIds,
  season,
  onRematch,
  onNew,
  onClose,
}: {
  yours: PlayerDetail[]
  opponentIds: number[]
  keeperIds: number[]
  season: number | undefined
  onRematch: () => void
  onNew: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const queries = usePlayersByIds([...opponentIds, ...keeperIds])
  if (queries.some((q) => q.isError)) {
    return (
      <div className="match__body">
        <p className="note">{t('error.UNKNOWN')}</p>
        <button type="button" className="btn" onClick={onNew}>
          {t('match.new')}
        </button>
      </div>
    )
  }
  if (queries.some((q) => !q.data)) {
    return (
      <div className="match__body" aria-busy="true">
        <div className="skeleton skeleton--block" />
      </div>
    )
  }
  const loaded = queries.map((q) => q.data as PlayerDetail)
  const opponents = loaded.slice(0, opponentIds.length)
  const [yourKeeper, theirKeeper] = loaded.slice(opponentIds.length)
  return (
    <Match
      home={yours.map((p) => fielderFrom(p, season))}
      away={opponents.map((p) => fielderFrom(p, season))}
      keepers={{ home: fielderFrom(yourKeeper, season), away: fielderFrom(theirKeeper, season) }}
      onRematch={onRematch}
      onNew={onNew}
      onClose={onClose}
    />
  )
}
