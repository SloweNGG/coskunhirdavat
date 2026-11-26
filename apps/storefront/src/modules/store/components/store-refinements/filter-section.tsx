"use client"

import { ChevronDownMini } from "@medusajs/icons"
import { ReactNode, useId, useState } from "react"

import { clx } from "@modules/common/components/ui"

type FilterSectionProps = {
  title: string
  /** How many values in this section are selected, shown as a badge. */
  selectedCount?: number
  /** Whether the section starts open. A section with a selection always does. */
  defaultOpen?: boolean
  children: ReactNode
  "data-testid"?: string
}

/**
 * One collapsible block of the filter sidebar. Until the shopper toggles it, a
 * section follows its default and opens by itself once it has a selection,
 * since filters restored from the URL arrive after the first render.
 */
const FilterSection = ({
  title,
  selectedCount = 0,
  defaultOpen = true,
  children,
  "data-testid": dataTestId,
}: FilterSectionProps) => {
  const [toggled, setToggled] = useState<boolean | null>(null)
  const contentId = useId()
  const isOpen = toggled ?? (defaultOpen || selectedCount > 0)

  return (
    <section data-testid={dataTestId}>
      <h3>
        <button
          type="button"
          onClick={() => setToggled(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex w-full items-center justify-between gap-x-2 px-4 py-3 text-left transition-colors hover:bg-soft"
        >
          <span className="flex items-center gap-x-2 text-sm font-semibold text-navy">
            {title}
            {selectedCount > 0 && (
              <span className="min-w-[18px] rounded-full bg-brand px-1.5 text-center text-[11px] font-semibold leading-[18px] text-brand-fg">
                {selectedCount}
              </span>
            )}
          </span>
          <ChevronDownMini
            className={clx(
              "shrink-0 text-muted transition-transform duration-150",
              { "rotate-180": isOpen }
            )}
          />
        </button>
      </h3>
      <div id={contentId} hidden={!isOpen} className="px-4 pb-4">
        {children}
      </div>
    </section>
  )
}

export default FilterSection
