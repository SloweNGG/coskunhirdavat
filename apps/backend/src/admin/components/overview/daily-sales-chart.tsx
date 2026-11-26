import { Table, Text } from "@medusajs/ui"
import { CSSProperties, KeyboardEvent, PointerEvent, useState } from "react"
import {
  DailySales,
  formatAxisMoney,
  formatLongDay,
  formatMoney,
  formatMoneyRounded,
  formatNumber,
  formatShortDay,
} from "../../lib/overview"
import { useElementWidth } from "./use-element-width"

const TOP = 24 // room above the tallest bar for its label
const PLOT_H = 200
const AXIS_H = 28 // x-axis date labels live inside the SVG height
const LEFT = 76 // y-axis tick labels, wide enough for "₺1,5 milyon"
const RIGHT = 16
const MAX_BAR = 24
const LABEL_SPACE = 52 // px one "26 Kas" label needs without touching the next
const TOOLTIP_W = 168

const niceStep = (raw: number) => {
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const r = raw / magnitude
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * magnitude
}

/** Column with a 4px rounded top and a square foot on the baseline. */
const columnPath = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h}Z`
}

type Props = { data: DailySales[]; currency: string }

/** Revenue per day as columns. Hover, or focus and use the arrow keys, for details. */
export const DailySalesChart = ({ data, currency }: Props) => {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const n = data.length
  const max = Math.max(0, ...data.map((d) => d.revenue))
  const step = niceStep(max > 0 ? max / 4 : 250)
  const top = Math.max(step * Math.ceil(max / step), step)
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const compactTicks = top >= 10_000

  const plotW = Math.max(width - LEFT - RIGHT, 0)
  const slot = n ? plotW / n : 0
  const barW = Math.min(MAX_BAR, Math.max(slot * 0.62, 2))
  const labelEvery = Math.max(1, Math.ceil(LABEL_SPACE / Math.max(slot, 1)))
  const yOf = (v: number) => TOP + PLOT_H - (v / top) * PLOT_H
  const centerOf = (i: number) => LEFT + (i + 0.5) * slot
  const peak = max > 0 ? data.findIndex((d) => d.revenue === max) : -1

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    if (x < LEFT || x > LEFT + plotW || !slot) {
      setActive(null)
      return
    }
    setActive(Math.min(n - 1, Math.floor((x - LEFT) / slot)))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? n) - 1),
      ArrowRight: Math.min(n - 1, (active ?? -1) + 1),
      Home: 0,
      End: n - 1,
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key])
    }
  }

  const activeDay = active !== null ? data[active] : null
  const describe = (d: DailySales) =>
    `${formatLongDay(d.date)}: ${formatMoney(d.revenue, currency)}, ${formatNumber(d.orders)} sipariş`

  // Tooltip sits beside the hovered column, on whichever side has room.
  let tooltipStyle: CSSProperties | undefined
  if (active !== null) {
    const cx = centerOf(active)
    const onRight = cx + barW / 2 + 8 + TOOLTIP_W <= width
    tooltipStyle = {
      top: TOP,
      width: TOOLTIP_W,
      left: onRight ? cx + barW / 2 + 8 : Math.max(0, cx - barW / 2 - 8 - TOOLTIP_W),
    }
  }

  return (
    <div
      ref={ref}
      className="relative rounded-md outline-none focus-visible:shadow-borders-focus"
      tabIndex={0}
      role="group"
      aria-roledescription="grafik"
      aria-label="Günlük satışlar. Günler arasında sol ve sağ ok tuşlarıyla gezinebilirsiniz."
      onKeyDown={onKeyDown}
      onFocus={() => setActive((a) => a ?? n - 1)}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={TOP + PLOT_H + AXIS_H}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          aria-hidden
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={LEFT}
                x2={width - RIGHT}
                y1={Math.round(yOf(t)) + 0.5}
                y2={Math.round(yOf(t)) + 0.5}
                stroke={t === 0 ? "var(--border-strong)" : "var(--border-base)"}
                shapeRendering="crispEdges"
              />
              <text
                x={LEFT - 8}
                y={yOf(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--fg-muted)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatAxisMoney(t, compactTicks, currency)}
              </text>
            </g>
          ))}

          {active !== null && (
            <rect
              x={LEFT + active * slot}
              y={TOP}
              width={slot}
              height={PLOT_H}
              fill="var(--bg-base-hover)"
            />
          )}

          {data.map((d, i) => {
            if (d.revenue <= 0) {
              return null
            }
            const h = Math.max(PLOT_H - (yOf(d.revenue) - TOP), 1)
            return (
              <path
                key={d.date}
                d={columnPath(centerOf(i) - barW / 2, TOP + PLOT_H - h, barW, h)}
                fill="var(--series-1)"
                opacity={active !== null && active !== i ? 0.55 : 1}
              />
            )
          })}

          {peak >= 0 && active === null && (
            <text
              x={Math.min(Math.max(centerOf(peak), LEFT + 28), width - RIGHT - 28)}
              y={yOf(max) - 8}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              fill="var(--fg-subtle)"
            >
              {formatMoneyRounded(max, currency)}
            </text>
          )}

          {data.map((d, i) =>
            (n - 1 - i) % labelEvery === 0 ? (
              <text
                key={d.date}
                x={centerOf(i)}
                y={TOP + PLOT_H + 18}
                textAnchor="middle"
                fontSize={11}
                fill="var(--fg-muted)"
              >
                {formatShortDay(d.date)}
              </text>
            ) : null
          )}
        </svg>
      )}

      {activeDay && (
        <div
          className="bg-ui-bg-base shadow-elevation-tooltip pointer-events-none absolute flex flex-col rounded-lg px-3 py-2"
          style={tooltipStyle}
        >
          <span className="txt-compact-small-plus text-ui-fg-base">
            {formatMoney(activeDay.revenue, currency)}
          </span>
          <span className="txt-compact-small text-ui-fg-subtle">
            {formatNumber(activeDay.orders)} sipariş
          </span>
          <span className="txt-compact-xsmall text-ui-fg-muted mt-1">
            {formatLongDay(activeDay.date)}
          </span>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {activeDay ? describe(activeDay) : ""}
      </div>
    </div>
  )
}

/** The same numbers as a table: the chart's accessible twin. */
export const DailySalesTable = ({ data, currency }: Props) => {
  const rows = data.filter((d) => d.orders > 0).reverse()
  if (!rows.length) {
    return (
      <Text size="small" className="text-ui-fg-muted py-6">
        Bu dönemde satış yok.
      </Text>
    )
  }
  return (
    <div className="max-h-[260px] overflow-auto">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Gün</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Sipariş</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Satış</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((d) => (
            <Table.Row key={d.date}>
              <Table.Cell>{formatLongDay(d.date)}</Table.Cell>
              <Table.Cell className="text-right tabular-nums">{formatNumber(d.orders)}</Table.Cell>
              <Table.Cell className="text-right tabular-nums">
                {formatMoney(d.revenue, currency)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Text size="xsmall" className="text-ui-fg-muted px-1 pt-2">
        Satış olmayan günler listelenmiyor.
      </Text>
    </div>
  )
}
