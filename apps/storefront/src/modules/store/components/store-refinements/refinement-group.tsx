"use client"

import { useRefinementList } from "react-instantsearch"

import FacetList from "./facet-list"
import FilterSection from "./filter-section"

type RefinementGroupProps = {
  attribute: string
  title: string
  defaultOpen?: boolean
}

const RefinementGroup = ({
  attribute,
  title,
  defaultOpen = true,
}: RefinementGroupProps) => {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 50,
    sortBy: ["count:desc", "name:asc"],
  })

  if (!items.length) {
    return null
  }

  return (
    <FilterSection
      title={title}
      selectedCount={items.filter((item) => item.isRefined).length}
      defaultOpen={defaultOpen}
    >
      <FacetList
        items={items}
        onToggle={refine}
        data-testid={`refinement-${attribute}`}
      />
    </FilterSection>
  )
}

export default RefinementGroup
