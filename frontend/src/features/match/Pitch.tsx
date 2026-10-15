import { useEffect, useId, useRef } from 'react'
import { initials } from '../../lib/format'
import { PITCH, type Frame, type Point } from './choreography'
import type { Fielder, Side } from './engine'

const PIECE_R = 36
const PHOTO_R = 30

interface Props {
  home: Fielder[]
  away: Fielder[]
  homeRest: Point[]
  awayRest: Point[]
  keepers: Record<Side, Fielder>
  keeperRest: Record<Side, Point>
  /** Il padre ci scrive il fotogramma ad ogni frame: niente rendering React per ogni movimento. */
  applyRef: { current: ((frame: Frame) => void) | null }
  homeColors: string[]
}

const at = (p: Point) => `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`

/** Campo visto dall'alto con pedine rotonde alla Subbuteo. Il movimento è imperativo (refs), non stato React. */
export function Pitch({ home, away, homeRest, awayRest, keepers, keeperRest, applyRef, homeColors }: Props) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const el = (name: string) => svg.querySelector<SVGElement>(`[data-p="${name}"]`)
    const homeEls = home.map((_, i) => el(`h${i}`))
    const awayEls = away.map((_, i) => el(`a${i}`))
    const ball = el('ball')
    const gkHome = el('gk-home')
    const gkAway = el('gk-away')
    const net = el('net')
    applyRef.current = (frame) => {
      frame.home.forEach((p, i) => homeEls[i]?.setAttribute('transform', at(p)))
      frame.away.forEach((p, i) => awayEls[i]?.setAttribute('transform', at(p)))
      gkHome?.setAttribute('transform', at(frame.gk.home))
      gkAway?.setAttribute('transform', at(frame.gk.away))
      ball?.setAttribute('transform', at(frame.ball))
      net?.setAttribute('opacity', frame.inNet ? '1' : '0')
    }
    return () => {
      applyRef.current = null
    }
  }, [applyRef, home, away, keepers])

  const piece = (f: Fielder, rest: Point, ring: string, name: string) => (
    <g key={f.id} data-p={name} transform={at(rest)}>
      <ellipse cx={4} cy={9} rx={PIECE_R} ry={PIECE_R - 4} fill="rgb(0 0 0 / 35%)" />
      <circle r={PIECE_R} fill="#0b0f14" stroke={ring} strokeWidth={5} />
      <circle r={PHOTO_R} fill="#1f2937" />
      <text textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fill="#b4bac4">
        {initials(f.name)}
      </text>
      {f.photoUrl && (
        <image
          href={f.photoUrl}
          x={-PHOTO_R}
          y={-PHOTO_R}
          width={PHOTO_R * 2}
          height={PHOTO_R * 2}
          preserveAspectRatio="xMidYMin slice"
          clipPath={`url(#${uid}-clip)`}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
    </g>
  )

  return (
    <svg
      ref={svgRef}
      className="pitch"
      viewBox={`0 0 ${PITCH.w} ${PITCH.h}`}
      role="img"
      aria-label={`${[...home, keepers.home].map((f) => f.name).join(', ')} / ${[...away, keepers.away].map((f) => f.name).join(', ')}`}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle r={PHOTO_R} />
        </clipPath>
        <linearGradient id={`${uid}-grass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14532d" />
          <stop offset="1" stopColor="#0f3d21" />
        </linearGradient>
      </defs>
      <rect width={PITCH.w} height={PITCH.h} rx={22} fill={`url(#${uid}-grass)`} />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 100} width={50} height={PITCH.h} fill="rgb(255 255 255 / 3%)" />
      ))}
      <g fill="none" stroke="rgb(255 255 255 / 55%)" strokeWidth={3}>
        <rect x={18} y={18} width={PITCH.w - 36} height={PITCH.h - 36} rx={6} />
        <line x1={500} y1={18} x2={500} y2={PITCH.h - 18} />
        <circle cx={500} cy={300} r={78} />
        <rect x={18} y={170} width={120} height={260} />
        <rect x={PITCH.w - 138} y={170} width={120} height={260} />
        <rect x={0} y={245} width={18} height={110} stroke="rgb(255 255 255 / 85%)" />
        <rect x={PITCH.w - 18} y={245} width={18} height={110} stroke="rgb(255 255 255 / 85%)" />
      </g>
      <circle cx={500} cy={300} r={5} fill="rgb(255 255 255 / 55%)" />
      <rect
        data-p="net"
        x={PITCH.w - 60}
        y={245}
        width={60}
        height={110}
        fill="rgb(57 211 83 / 55%)"
        opacity={0}
        style={{ transition: 'opacity 0.15s' }}
      />

      {home.map((f, i) => piece(f, homeRest[i], homeColors[i], `h${i}`))}
      {away.map((f, i) => piece(f, awayRest[i], '#e5e7eb', `a${i}`))}
      {piece(keepers.home, keeperRest.home, '#f5b544', 'gk-home')}
      {piece(keepers.away, keeperRest.away, '#f5b544', 'gk-away')}

      <g data-p="ball" transform={at({ x: 500, y: 300 })}>
        <ellipse cx={3} cy={5} rx={12} ry={8} fill="rgb(0 0 0 / 35%)" />
        <circle r={12} fill="#fff" stroke="#0b0f14" strokeWidth={2} />
        <circle r={4.5} fill="#0b0f14" />
      </g>
    </svg>
  )
}
