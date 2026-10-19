import type { jsPDF } from 'jspdf'
import type { PlayerDetail, PlayerNote, Projection, SeasonEntry } from '../../../api/types'
import type { I18nValue } from '../../../i18n/useI18n'
import { countryName } from '../../../lib/countries'
import { formatDate, formatNumber, seasonLabel } from '../../../lib/format'
import { axisFor, xAt, yAt, type Plot } from '../../../lib/growth'
import { pdfSafe } from '../../../lib/pdfText'
import { axisAngle, polarPoint, radarPoints, shortLabel, wrapLabel } from '../../../lib/radar'
import { radarAxisKeys, radarValues } from '../../../lib/radarAxes'
import { zoneScores, type ZoneId } from '../../../lib/zones'
import { MIN_MINUTES_FOR_PERCENTILES } from '../helpers'

type Rgb = [number, number, number]

const INK: Rgb = [11, 15, 20]
const MUTED: Rgb = [92, 101, 115]
const LINE: Rgb = [208, 213, 220]
const GREEN: Rgb = [20, 128, 58]
const BRAND: Rgb = [57, 211, 83]
const PAPER_DARK: Rgb = [11, 15, 20]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_H = 14

export interface PdfInput {
  t: I18nValue['t']
  metricLabel: I18nValue['metricLabel']
  locale: string
  lang: I18nValue['lang']
  player: PlayerDetail
  entry: SeasonEntry
  /** null se non è stata caricata: nel PDF compare come "non disponibile" */
  projection: Projection | null
  notes: PlayerNote[]
  now?: Date
}

/**
 * Scheda del giocatore in PDF, disegnata con testo e vettori (nessuna immagine): resta nitida, leggera e a tema
 * chiaro. Usa le stesse funzioni di geometria dei grafici a schermo, quindi i numeri sono gli stessi.
 */
export async function buildPlayerPdf(input: PdfInput): Promise<jsPDF> {
  const { jsPDF: PDF } = await import('jspdf')
  const doc = new PDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  new Sheet(doc, input).draw()
  return doc
}

interface TextOptions {
  align?: 'left' | 'center' | 'right'
  maxWidth?: number
}

class Sheet {
  private y = 0
  private readonly doc: jsPDF
  private readonly input: PdfInput

  constructor(doc: jsPDF, input: PdfInput) {
    this.doc = doc
    this.input = input
  }

  draw() {
    this.header()
    this.title()
    this.coreStats()
    this.profile()
    this.estimate()
    this.notes()
    this.footers()
  }

  // --- elementi di base

  private text(value: string, x: number, y: number, options?: TextOptions) {
    this.doc.text(pdfSafe(value), x, y, options)
  }

  private font(size: number, style: 'normal' | 'bold', color: Rgb) {
    this.doc.setFont('helvetica', style)
    this.doc.setFontSize(size)
    this.doc.setTextColor(...color)
  }

  private wrap(value: string, width: number): string[] {
    return this.doc.splitTextToSize(pdfSafe(value), width) as string[]
  }

  private withOpacity(opacity: number, draw: () => void) {
    this.doc.setGState(this.doc.GState({ opacity }))
    draw()
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
  }

  private polygon(points: { x: number; y: number }[], style: 'S' | 'F' | 'FD') {
    if (points.length < 2) return
    const [first, ...rest] = points
    const deltas: [number, number][] = []
    let px = first.x
    let py = first.y
    for (const p of rest) {
      deltas.push([p.x - px, p.y - py])
      px = p.x
      py = p.y
    }
    this.doc.lines(deltas, first.x, first.y, [1, 1], style, true)
  }

  /** Va a pagina nuova se non c'è spazio per altri h millimetri. */
  private ensure(h: number) {
    if (this.y + h > PAGE_H - FOOTER_H) {
      this.doc.addPage()
      this.y = MARGIN
    }
  }

  private heading(label: string) {
    this.ensure(14)
    this.font(12, 'bold', INK)
    this.text(label, MARGIN, this.y)
    this.doc.setDrawColor(...LINE)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGIN, this.y + 1.8, PAGE_W - MARGIN, this.y + 1.8)
    this.y += 8
  }

  // --- sezioni

  private header() {
    const { doc, input } = this
    doc.setFillColor(...PAPER_DARK)
    doc.rect(0, 0, PAGE_W, 20, 'F')
    this.font(17, 'bold', [255, 255, 255])
    this.text('Scout ', MARGIN, 13)
    const width = doc.getTextWidth('Scout ')
    this.font(17, 'bold', BRAND)
    this.text('AI', MARGIN + width, 13)
    this.font(8, 'normal', [180, 186, 196])
    this.text(input.t('footer.tagline'), PAGE_W - MARGIN, 13, { align: 'right' })
    this.y = 32
  }

  private title() {
    const { t, player, entry, lang } = this.input
    this.font(21, 'bold', INK)
    this.text(player.name, MARGIN, this.y)
    this.y += 7
    this.font(11, 'normal', MUTED)
    this.text(`${entry.team.name} · ${entry.league.name} · ${seasonLabel(entry.season)}`, MARGIN, this.y)
    this.y += 6

    const unknown = t('player.bio.unknown')
    const bio = [
      `${t('player.bio.age')}: ${player.age !== null ? player.age : unknown}`,
      `${t('player.bio.nationality')}: ${countryName(player.nationality, lang) ?? unknown}`,
      `${t('player.bio.height')}: ${player.heightCm !== null ? `${player.heightCm} cm` : unknown}`,
      `${t('player.bio.position')}: ${entry.position ? t(`position.${entry.position}`) : unknown}`,
    ]
    this.font(9.5, 'normal', MUTED)
    this.text(bio.join('   ·   '), MARGIN, this.y)
    this.y += 9
  }

  private coreStats() {
    const { t, entry, locale } = this.input
    const cells: [string, string][] = [
      [t('stat.minutes'), formatNumber(entry.stats.minutes, locale)],
      [t('stat.appearances'), formatNumber(entry.stats.appearances, locale)],
      [t('stat.rating'), formatNumber(entry.stats.rating, locale, 2)],
      [t('stat.goals'), formatNumber(entry.stats.goals, locale)],
      [t('stat.assists'), formatNumber(entry.stats.assists, locale)],
    ]
    const w = CONTENT_W / cells.length
    this.doc.setFillColor(244, 246, 248)
    this.doc.roundedRect(MARGIN, this.y - 4, CONTENT_W, 17, 2, 2, 'F')
    cells.forEach(([label, value], i) => {
      const cx = MARGIN + w * i + w / 2
      this.font(15, 'bold', INK)
      this.text(value, cx, this.y + 4.5, { align: 'center' })
      this.font(7.5, 'normal', MUTED)
      this.text(label, cx, this.y + 9.5, { align: 'center' })
    })
    this.y += 24
  }

  private profile() {
    const { t, entry, metricLabel } = this.input
    this.ensure(98)
    this.heading(t('radar.title'))

    const top = this.y
    const keys = radarAxisKeys(entry.position)
    const values = radarValues(keys, entry.metrics)
    this.radar(keys.map((k) => shortLabel(metricLabel(k))), values, 62, top + 32, 24)
    this.zoneMap(entry, 130, top, 55, 62)

    this.y = top + 70
    this.font(7, 'normal', MUTED)
    const note = this.wrap(`${t('radar.note')} ${t('zone.note')}`, CONTENT_W)
    note.forEach((line, i) => this.text(line, MARGIN, this.y + i * 3.2))
    this.y += note.length * 3.2 + 8
  }

  private radar(labels: string[], values: (number | null)[], cx: number, cy: number, radius: number) {
    const { doc } = this
    const n = values.length
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.25)
    for (const ring of [25, 50, 75, 100]) {
      this.polygon(Array.from({ length: n }, (_, i) => polarPoint(i, n, ring, cx, cy, radius)), 'S')
    }
    for (let i = 0; i < n; i++) {
      const end = polarPoint(i, n, 100, cx, cy, radius)
      doc.line(cx, cy, end.x, end.y)
    }

    this.font(6.5, 'normal', MUTED)
    labels.forEach((label, i) => {
      const angle = axisAngle(i, n)
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const lines = wrapLabel(label, 15)
      const lx = cx + (radius + 3) * cos
      const ly = cy + (radius + 3) * sin
      const first =
        sin < -0.5 ? ly - (lines.length - 1) * 2.8 : sin > 0.5 ? ly + 2.5 : ly - ((lines.length - 1) * 2.8) / 2 + 1
      const align = cos > 0.25 ? 'left' : cos < -0.25 ? 'right' : 'center'
      lines.forEach((line, j) => this.text(line, lx, first + j * 2.8, { align }))
    })

    const known = radarPoints(values, cx, cy, radius)
    if (known.length < 3) {
      this.font(8, 'normal', MUTED)
      this.text(this.input.t('player.stamp.title'), cx, cy, { align: 'center' })
      return
    }
    doc.setFillColor(...GREEN)
    doc.setDrawColor(...GREEN)
    this.withOpacity(0.18, () => this.polygon(known, 'F'))
    doc.setLineWidth(0.6)
    this.polygon(known, 'S')
    for (const p of known) doc.circle(p.x, p.y, 0.9, 'F')
  }

  private zoneMap(entry: SeasonEntry, x: number, y: number, w: number, h: number) {
    const { doc } = this
    const { t } = this.input
    const zones = zoneScores(entry.metrics, entry.position)
    const names: Record<ZoneId, string> = {
      attack: t('zone.attack'),
      build: t('zone.build'),
      defense: t('zone.defense'),
      goal: t('zone.goal'),
    }
    const single = zones.length === 1
    const bandH = single ? 26 : h / zones.length

    zones.forEach((z, i) => {
      const by = single ? y + h - bandH : y + i * bandH
      if (z.score !== null) {
        doc.setFillColor(...GREEN)
        this.withOpacity(0.1 + (0.5 * z.score) / 100, () => doc.rect(x, by, w, bandH, 'F'))
      }
      this.font(15, 'bold', INK)
      const label = z.score === null ? t('player.stamp.metric') : String(z.score)
      this.text(label, x + w / 2, by + bandH / 2 + 1, { align: 'center' })
      this.font(7.5, 'normal', MUTED)
      this.text(names[z.id], x + w / 2, by + bandH / 2 + 6, { align: 'center' })
    })

    doc.setDrawColor(...MUTED)
    doc.setLineWidth(0.35)
    doc.roundedRect(x, y, w, h, 2, 2, 'S')
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.25)
    if (!single) {
      for (let i = 1; i < zones.length; i++) doc.line(x, y + i * bandH, x + w, y + i * bandH)
    }
  }

  private estimate() {
    const { t, locale, projection, entry } = this.input
    this.ensure(92)
    this.heading(t('proj.title'))

    if (!projection || !projection.available) {
      this.font(9.5, 'normal', MUTED)
      const reason = projection?.reason ?? 'NO_SEASON'
      this.wrap(t(`proj.reason.${reason}`, { min: MIN_MINUTES_FOR_PERCENTILES }), CONTENT_W).forEach((line, i) =>
        this.text(line, MARGIN, this.y + i * 4.5),
      )
      this.y += 14
      return
    }

    this.font(24, 'bold', INK)
    const value = `${formatNumber(projection.currentValueM, locale, 1)} M€`
    this.text(value, MARGIN, this.y + 4)
    const valueW = this.doc.getTextWidth(pdfSafe(value))
    this.doc.setFillColor(222, 242, 229)
    this.doc.roundedRect(MARGIN + valueW + 4, this.y - 2, 18, 7, 3.5, 3.5, 'F')
    this.font(8.5, 'bold', GREEN)
    this.text(t('proj.badge'), MARGIN + valueW + 13, this.y + 2.7, { align: 'center' })

    this.font(8.5, 'normal', MUTED)
    this.text(
      t('proj.basis', {
        score: formatNumber(projection.score, locale, 0),
        season: seasonLabel(projection.season ?? entry.season),
      }),
      MARGIN,
      this.y + 11,
    )
    this.y += 17

    this.growthChart(projection)
    this.font(7, 'normal', MUTED)
    const note = this.wrap(t('proj.note'), CONTENT_W)
    note.forEach((line, i) => this.text(line, MARGIN, this.y + i * 3.2))
    this.y += note.length * 3.2 + 8
  }

  private growthChart(projection: Projection) {
    const { doc } = this
    const { t, locale } = this.input
    const points = projection.points
    const top = this.y
    const boxH = 52
    const plot: Plot = {
      width: MARGIN + CONTENT_W,
      height: top + boxH,
      left: MARGIN + 11,
      right: 6,
      top: top + 2,
      bottom: 12,
    }
    const axis = axisFor(Math.max(...points.map((p) => p.maxM)))

    this.font(7, 'normal', MUTED)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.2)
    for (const tick of axis.ticks) {
      const ty = yAt(tick, axis.max, plot)
      doc.line(plot.left, ty, plot.width - plot.right, ty)
      const decimals = tick >= 10 || Number.isInteger(tick) ? 0 : 1
      this.text(formatNumber(tick, locale, decimals), plot.left - 2, ty + 1, { align: 'right' })
    }

    const xy = (i: number, v: number) => ({ x: xAt(i, points.length, plot), y: yAt(v, axis.max, plot) })
    const upper = points.map((p, i) => xy(i, p.maxM))
    const lower = points.map((p, i) => xy(i, p.minM)).reverse()
    doc.setFillColor(...GREEN)
    this.withOpacity(0.16, () => this.polygon([...upper, ...lower], 'F'))

    doc.setDrawColor(...GREEN)
    doc.setLineWidth(0.3)
    doc.setLineDashPattern([1.2, 1.2], 0)
    for (const edge of [upper, [...lower].reverse()]) {
      edge.forEach((p, i) => {
        if (i > 0) doc.line(edge[i - 1].x, edge[i - 1].y, p.x, p.y)
      })
    }
    doc.setLineDashPattern([], 0)

    doc.setLineWidth(0.8)
    const mid = points.map((p, i) => xy(i, p.midM))
    mid.forEach((p, i) => {
      if (i > 0) doc.line(mid[i - 1].x, mid[i - 1].y, p.x, p.y)
    })
    doc.setFillColor(...GREEN)
    for (const p of mid) doc.circle(p.x, p.y, 0.9, 'F')

    this.font(7, 'normal', MUTED)
    points.forEach((p, i) => this.text(String(p.age), xAt(i, points.length, plot), top + boxH - 6, { align: 'center' }))
    this.text(t('proj.age'), (plot.left + plot.width - plot.right) / 2, top + boxH - 2, { align: 'center' })
    this.text(`${t('proj.chart.title')}`, MARGIN, top - 1)
    this.y = top + boxH + 3
  }

  private notes() {
    const { t, locale, notes } = this.input
    this.ensure(26)
    this.heading(t('notes.title'))
    if (notes.length === 0) {
      this.font(9.5, 'normal', MUTED)
      this.text(t('notes.empty'), MARGIN, this.y)
      this.y += 8
      return
    }
    for (const note of notes) {
      this.font(9.5, 'normal', INK)
      const lines = this.wrap(note.body, CONTENT_W - 4)
      this.ensure(6 + lines.length * 4.4)
      this.font(7.5, 'normal', MUTED)
      this.text(formatDate(note.createdAt, locale) ?? '', MARGIN, this.y)
      this.y += 4
      this.font(9.5, 'normal', INK)
      lines.forEach((line, i) => this.text(line, MARGIN + 2, this.y + i * 4.4))
      this.y += lines.length * 4.4 + 3
    }
  }

  private footers() {
    const { doc } = this
    const { t, locale, now } = this.input
    const total = doc.getNumberOfPages()
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(now ?? new Date())
    for (let page = 1; page <= total; page++) {
      doc.setPage(page)
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.25)
      doc.line(MARGIN, PAGE_H - 11, PAGE_W - MARGIN, PAGE_H - 11)
      this.font(7.5, 'normal', MUTED)
      this.text(`Scout AI · ${t('pdf.source')} · ${t('pdf.generated', { date })}`, MARGIN, PAGE_H - 7)
      this.text(t('pdf.page', { n: page, total }), PAGE_W - MARGIN, PAGE_H - 7, { align: 'right' })
    }
  }
}
