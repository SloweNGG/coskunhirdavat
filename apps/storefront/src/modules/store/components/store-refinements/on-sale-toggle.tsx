"use client"

import { useToggleRefinement } from "react-instantsearch"

import { priceAttribute } from "@lib/search-client"

/**
 * Narrows to products whose calculated price is below their original in the
 * region's currency. Hides itself when nothing is discounted, which is the
 * case until a price list applies to some product.
 */
const OnSaleToggle = ({ currencyCode }: { currencyCode: string }) => {
  const { value, refine, canRefine } = useToggleRefinement({
    attribute: priceAttribute("on_sale", currencyCode),
    on: true,
  })

  if (!canRefine) {
    return null
  }

  return (
    <div className="px-4 py-3">
      <label className="flex cursor-pointer items-center gap-x-2.5">
        <input
          type="checkbox"
          checked={value.isRefined}
          onChange={() => refine(value)}
          className="h-4 w-4 shrink-0 cursor-pointer accent-brand"
          data-testid="on-sale-toggle"
        />
        <span className="flex-1 text-sm font-semibold text-navy">
          Yalnızca indirimdekiler
        </span>
        {typeof value.count === "number" && (
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {value.count}
          </span>
        )}
      </label>
    </div>
  )
}

export default OnSaleToggle
