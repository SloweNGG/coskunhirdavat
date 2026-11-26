"use client"

import { Adjustments, ChevronDownMini } from "@medusajs/icons"
import { useState } from "react"
import { useCurrentRefinements, useSortBy } from "react-instantsearch"

import SortSelect from "@modules/common/components/sort-select"
import { clx } from "@modules/common/components/ui"
import {
  CATEGORY_ATTRIBUTE,
  LABELS_ATTRIBUTE,
  getSortOptions,
} from "./attributes"
import CurrentRefinements from "./current-refinements"
import OnSaleToggle from "./on-sale-toggle"
import OptionRefinements from "./option-refinements"
import PriceRange from "./price-range"
import RefinementGroup from "./refinement-group"

const SortProducts = ({ currencyCode }: { currencyCode: string }) => {
  const items = getSortOptions(currencyCode)
  const { currentRefinement, refine } = useSortBy({ items })

  return (
    <SortSelect
      items={items}
      value={currentRefinement}
      onChange={refine}
      data-testid="sort-by-container"
    />
  )
}

/**
 * Filter sidebar of the store page: one bordered panel of collapsible
 * sections. Below the `small` breakpoint the panel hides behind a toggle so
 * the products come first.
 */
const StoreRefinements = ({ currencyCode }: { currencyCode: string }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { items } = useCurrentRefinements()
  const activeCount = items.reduce(
    (count, item) => count + item.refinements.length,
    0
  )

  return (
    <aside className="mb-6 w-full small:mb-0 small:mr-8 small:w-[260px] small:shrink-0">
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-controls="store-filters"
        className="flex h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-4 text-sm font-semibold text-navy small:hidden"
      >
        <span className="flex items-center gap-x-2">
          <Adjustments />
          Filtrele ve sırala
          {activeCount > 0 && (
            <span className="min-w-[18px] rounded-full bg-brand px-1.5 text-center text-[11px] leading-[18px] text-brand-fg">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDownMini
          className={clx("text-muted transition-transform duration-150", {
            "rotate-180": mobileOpen,
          })}
        />
      </button>

      <div
        id="store-filters"
        className={clx(
          "mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white small:mt-0",
          mobileOpen ? "block" : "hidden small:block"
        )}
      >
        <div className="px-4 py-3">
          <SortProducts currencyCode={currencyCode} />
        </div>
        <CurrentRefinements currencyCode={currencyCode} />
        <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="Kategori" />
        <PriceRange currencyCode={currencyCode} />
        <OnSaleToggle currencyCode={currencyCode} />
        <OptionRefinements />
        <RefinementGroup
          attribute={LABELS_ATTRIBUTE}
          title="Etiketler"
          defaultOpen={false}
        />
      </div>
    </aside>
  )
}

export default StoreRefinements
