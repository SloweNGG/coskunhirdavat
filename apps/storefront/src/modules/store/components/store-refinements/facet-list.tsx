"use client"

import { useState } from "react"

import { clx } from "@modules/common/components/ui"

export type FacetItem = {
  value: string
  label: string
  count: number
  isRefined: boolean
}

const VISIBLE_COUNT = 6

type FacetListProps = {
  items: FacetItem[]
  onToggle: (value: string) => void
  "data-testid"?: string
}

/**
 * Checkbox list for one facet. A long list shows its first few values plus any
 * selected ones, with a toggle for the rest.
 */
const FacetList = ({
  items,
  onToggle,
  "data-testid": dataTestId,
}: FacetListProps) => {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded
    ? items
    : items.filter((item, index) => index < VISIBLE_COUNT || item.isRefined)
  const hiddenCount = items.length - visible.length

  return (
    <div className="flex flex-col items-start gap-y-1.5">
      <ul className="flex w-full flex-col">
        {visible.map((item) => (
          <li key={item.value}>
            <label className="-mx-1.5 flex cursor-pointer items-center gap-x-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-soft">
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => onToggle(item.value)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-brand"
                data-testid={dataTestId}
              />
              <span
                className={clx(
                  "min-w-0 flex-1 break-words text-sm leading-snug",
                  item.isRefined ? "font-medium text-navy" : "text-navy/75"
                )}
              >
                {item.label}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {item.count}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {expanded
        ? items.length > VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-sm font-semibold text-brand-ink hover:text-navy"
            >
              Daha az göster
            </button>
          )
        : hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm font-semibold text-brand-ink hover:text-navy"
            >
              +{hiddenCount} daha göster
            </button>
          )}
    </div>
  )
}

export default FacetList
