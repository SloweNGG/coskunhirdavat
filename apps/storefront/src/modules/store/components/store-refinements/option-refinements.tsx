"use client"

import { useRefinementList } from "react-instantsearch"

import { OPTION_VALUES_ATTRIBUTE } from "./attributes"
import FacetList, { FacetItem } from "./facet-list"
import FilterSection from "./filter-section"

const FACET_LIMIT = 200

type OptionGroup = {
  title: string
  values: FacetItem[]
}

// Number-aware, so "5 Adet" comes before "10 Adet" and "100 Adet".
const compareLabels = (a: string, b: string) =>
  a.localeCompare(b, "tr", { numeric: true, sensitivity: "base" })

/** Splits the index's `Title:value` facet values into one group per option. */
function groupItems(
  items: ReturnType<typeof useRefinementList>["items"]
): OptionGroup[] {
  const groups = new Map<string, OptionGroup>()

  for (const item of items) {
    const separator = item.label.indexOf(":")

    if (separator < 1) {
      continue
    }

    const title = item.label.slice(0, separator)
    const label = item.label.slice(separator + 1)

    if (!groups.has(title)) {
      groups.set(title, { title, values: [] })
    }

    groups.get(title)!.values.push({
      label,
      value: item.value,
      count: item.count,
      isRefined: item.isRefined,
    })
  }

  const sorted = Array.from(groups.values()).sort((a, b) =>
    compareLabels(a.title, b.title)
  )
  sorted.forEach((group) =>
    group.values.sort((a, b) => compareLabels(a.label, b.label))
  )

  return sorted
}

/**
 * One collapsed section per product option (Adet, Renk, Beden...). There can
 * be many, so they start closed unless something in them is selected.
 */
const OptionRefinements = () => {
  const { items, refine } = useRefinementList({
    attribute: OPTION_VALUES_ATTRIBUTE,
    limit: FACET_LIMIT,
    sortBy: ["name:asc"],
    operator: "and",
  })

  const groups = groupItems(items)

  return (
    <>
      {groups.map((group) => (
        <FilterSection
          key={group.title}
          title={group.title}
          selectedCount={group.values.filter((value) => value.isRefined).length}
          defaultOpen={false}
        >
          <FacetList
            items={group.values}
            onToggle={refine}
            data-testid="option-refinement"
          />
        </FilterSection>
      ))}
    </>
  )
}

export default OptionRefinements
