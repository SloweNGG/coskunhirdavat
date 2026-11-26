"use client"

import * as Slider from "@radix-ui/react-slider"
import { useEffect, useState } from "react"
import { useRange } from "react-instantsearch"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { convertToLocale } from "@lib/util/money"
import FilterSection from "./filter-section"

function formatAmount(amount: number, currency: string) {
    try {
      return convertToLocale({
        amount,
        currency_code: currency,
        maximumFractionDigits: 0,
      })
    } catch {
      // An unrecognised currency code shouldn't take the sidebar down.
      return `${Math.round(amount)} ${currency.toUpperCase()}`
    }
}

/**
 * Price filter over the region currency's `min_price_*` field, which is
 * declared `facetable({ types: ["stats"] })` — the stats facet is what
 * supplies the slider's bounds. Refines on release rather than per pixel.
 */
const PriceRange = ({ currencyCode }: { currencyCode: string }) => {
  const { start, range, canRefine, refine } = useRange({
    attribute: priceAttribute("min_price", currencyCode),
  })
  const currency = indexedCurrency(currencyCode)
  const format = (amount: number) => formatAmount(amount, currency)

  const min = Math.floor(range.min ?? 0)
  const max = Math.ceil(range.max ?? 0)

  // `start` holds ±Infinity for an unset bound, so fall back to the extremes.
  const from = Number.isFinite(start[0]) ? (start[0] as number) : min
  const to = Number.isFinite(start[1]) ? (start[1] as number) : max

  const [value, setValue] = useState<number[]>([from, to])

  // Follow the refinement when it changes elsewhere — clearing all filters, or
  // a bound arriving from the URL on load.
  useEffect(() => {
    setValue([from, to])
  }, [from, to])

  // No stats yet, or every product costs the same: nothing to slide between.
  if (!canRefine || min >= max) {
    return null
  }

  const isRefined = Number.isFinite(start[0]) || Number.isFinite(start[1])

  return (
    <FilterSection title="Fiyat" selectedCount={isRefined ? 1 : 0}>
      <div className="flex flex-col gap-y-3 pt-1">
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={value}
          min={min}
          max={max}
          step={1}
          minStepsBetweenThumbs={0}
          onValueChange={setValue}
          // Only refine when the thumb is released, so dragging doesn't fire a
          // search per pixel.
          onValueCommit={(committed) => refine([committed[0], committed[1]])}
          aria-label="Fiyat aralığı"
          data-testid="price-range"
        >
          <Slider.Track className="relative h-1 w-full grow rounded-full bg-line">
            <Slider.Range className="absolute h-full rounded-full bg-brand" />
          </Slider.Track>
          {value.map((_, index) => (
            <Slider.Thumb
              key={index}
              className="block h-4 w-4 cursor-grab rounded-full border-2 border-brand bg-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label={index === 0 ? "En düşük fiyat" : "En yüksek fiyat"}
            />
          ))}
        </Slider.Root>

        <div className="flex items-center gap-x-2">
          <span className="flex-1 rounded-md border border-line px-2 py-1.5 text-center font-price text-xs tabular-nums text-navy">
            {format(value[0])}
          </span>
          <span className="text-muted">–</span>
          <span className="flex-1 rounded-md border border-line px-2 py-1.5 text-center font-price text-xs tabular-nums text-navy">
            {format(value[1])}
          </span>
        </div>
      </div>
    </FilterSection>
  )
}

export default PriceRange
