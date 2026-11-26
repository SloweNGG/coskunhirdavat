"use client"

import SortSelect from "@modules/common/components/sort-select"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: string) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "En yeniler",
  },
  {
    value: "price_asc",
    label: "Fiyat: Artan",
  },
  {
    value: "price_desc",
    label: "Fiyat: Azalan",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: string) => {
    setQueryParams("sortBy", value as SortOptions)
  }

  return (
    <SortSelect
      items={sortOptions}
      value={sortBy}
      onChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
