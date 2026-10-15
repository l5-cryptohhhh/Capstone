import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { SLOTS } from '../compare/helpers'
import { GOAL_AT, buildTimeline, frameAt, type Frame } from './choreography'
import { KEEPER, REAL_DURATION_MS, matchMinuteAt, simulateMatch, type Action, type Fielder, type MatchResult, type Side } from './engine'
import { Pitch } from './Pitch'

const SHOT_KEY = {
  goal: 'match.ev.goal',
  saved: 'match.ev.saved',
  miss: 'match.ev.miss',
  blocked: 'match.ev.blocked',
} as const

const RESTART_KEY = {
  kickoff: 'match.cap.kickoff',
  throwIn: 'match.cap.throwIn',
  corner: 'match.cap.corner',
  goalKick: 'match.cap.goalKick',
  freeKick: 'match.cap.freeKick',
  keeper: 'match.cap.keeper',
} as const

const otherSide = (s: Side): Side => (s === 'home' ? 'away' : 'home')
/** Minuto di gioco in cui il gol "scatta": il punteggio non cambia prima. */
const goalMinute = (a: Action) => a.start + a.duration * GOAL_AT
/** Momenti che contano nella cronaca: i passaggi restano alla didascalia in diretta. */
const notable = (a: Action) => a.kind === 'shot' || a.kind === 'foul' || (a.kind === 'restart' && a.restart !== 'kickoff')

/** La partita: simulazione a gioco continuo vista dall'alto, 90' in 1 minuto reale. */
export function Match({
  home,
  away,
  keepers,
  onRematch,
  onNew,
  onClose,
}: {
  home: Fielder[]
  away: Fielder[]
  keepers: Record<Side, Fielder>
  onRematch: () => void
  onNew: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [result] = useState<MatchResult>(() => simulateMatch(home, away, Math.random, keepers))
  const timeline = useMemo(() => buildTimeline(result, home, away), [result, home, away])
  const homeColors = useMemo(() => SLOTS.map((s) => s.color), [])
  const applyRef = useRef<((frame: Frame) => void) | null>(null)

  const [minute, setMinute] = useState(0)
  const [clock, setClock] = useState(0)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let raf = 0
    let elapsed = 0
    let last = performance.now()
    let shownMinute = -1
    let shownIndex = -1

    const tick = (now: number) => {
      elapsed += now - last
      last = now
      const m = matchMinuteAt(elapsed)

      const frame = frameAt(timeline, m)
      applyRef.current?.(frame)

      const whole = Math.floor(m)
      if (whole !== shownMinute) {
        shownMinute = whole
        setClock(whole)
        setMinute(m)
      }
      if (frame.index !== shownIndex) {
        shownIndex = frame.index
        setIndex(frame.index)
        setMinute(m)
      }

      if (elapsed >= REAL_DURATION_MS) {
        setClock(90)
        setMinute(90)
        setIndex(timeline.actions.length)
        setDone(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    // Il tempo scorre solo mentre la scheda è visibile: al ritorno si riparte da qui, senza salti.
    const onVisible = () => {
      if (document.visibilityState === 'visible') last = performance.now()
    }
    document.addEventListener('visibilitychange', onVisible)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [timeline])

  const { actions } = result
  const squads = { home, away }
  const nameOf = (side: Side, i: number | undefined) =>
    i === undefined ? '' : i === KEEPER ? keepers[side].name : squads[side][i].name

  // Il punteggio si aggiorna quando scatta il gol; il minuto parte dall'inizio dell'azione in corso
  const goals = actions.filter((a) => a.outcome === 'goal' && (done || goalMinute(a) <= minute + 0.0001))
  const score = {
    home: goals.filter((a) => a.side === 'home').length,
    away: goals.filter((a) => a.side === 'away').length,
  }

  const caption = (a: Action | undefined): string => {
    if (!a) return ''
    const who = nameOf(a.side, a.carrier)
    const rival = nameOf(otherSide(a.side), a.rival)
    switch (a.kind) {
      case 'pass':
        if (a.result === 'ok') return t('match.cap.pass', { name: who, to: nameOf(a.side, a.target) })
        if (a.result === 'out') return t('match.cap.out')
        return t('match.cap.intercept', { name: rival, from: who })
      case 'dribble':
        return a.result === 'ok' ? t('match.cap.dribble', { name: who }) : t('match.cap.tackle', { name: rival, from: who })
      case 'foul':
        return t('match.cap.foul', { name: who })
      case 'shot':
        return t(SHOT_KEY[a.outcome ?? 'miss'], { name: who, keeper: nameOf(otherSide(a.side), KEEPER) })
      case 'restart':
        return t(RESTART_KEY[a.restart ?? 'kickoff'], { name: who })
    }
  }

  const feed = actions
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => i < index && notable(a))
    .reverse()
    .slice(0, 4)

  const scorers = (side: Side) =>
    actions
      .filter((a) => a.side === side && a.outcome === 'goal')
      .map((a) => `${nameOf(side, a.carrier)} ${Math.floor(goalMinute(a))}'`)

  const verdict =
    result.homeGoals === result.awayGoals
      ? t('match.draw')
      : result.homeGoals > result.awayGoals
        ? t('match.win')
        : t('match.lose')

  return (
    <div className="match__body">
      <div className="match__scoreboard" aria-live="off">
        <span className="match__team">{t('match.yours')}</span>
        <span className="match__score" aria-label={`${score.home} - ${score.away}`}>
          {score.home} <span aria-hidden="true">-</span> {score.away}
        </span>
        <span className="match__team match__team--away">{t('match.theirs')}</span>
        <span className="match__clock">{clock}&apos;</span>
      </div>

      <div className="match__stage">
        <Pitch
          home={home}
          away={away}
          homeRest={timeline.initial.home}
          awayRest={timeline.initial.away}
          keepers={keepers}
          keeperRest={timeline.initial.gk}
          applyRef={applyRef}
          homeColors={homeColors}
        />
        {done && (
          <div className="match__final" role="status">
            <p className="match__final-label">{t('match.fulltime')}</p>
            <p className="match__final-score">
              {result.homeGoals} - {result.awayGoals}
            </p>
            <p className="match__final-verdict">{verdict}</p>
            <div className="match__final-scorers">
              <ul>
                {scorers('home').map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <ul>
                {scorers('away').map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="match__final-actions">
              <button type="button" className="btn btn--primary" onClick={onRematch}>
                {t('match.rematch')}
              </button>
              <button type="button" className="btn" onClick={onNew}>
                {t('match.new')}
              </button>
              <button type="button" className="btn btn--quiet" onClick={onClose}>
                {t('match.close')}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="match__caption" aria-live="off">
        {done ? '' : caption(actions[index])}
      </p>

      <ol className="match__feed" aria-label={t('match.feed')}>
        {feed.map(({ a, i }) => (
          <li key={i} className={a.outcome === 'goal' ? 'is-goal' : undefined}>
            {Math.floor(a.start)}&apos; {caption(a)}
          </li>
        ))}
      </ol>
    </div>
  )
}
