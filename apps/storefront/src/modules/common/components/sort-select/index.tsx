import { ChevronUpDown } from "@medusajs/icons"

type SortSelectProps = {
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  "data-testid"?: string
}

/** One-line "Sırala" dropdown for product listings. */
const SortSelect = ({
  items,
  value,
  onChange,
  "data-testid": dataTestId,
}: SortSelectProps) => {
  return (
    <label className="flex items-center gap-x-3">
      <span className="shrink-0 text-sm font-semibold text-navy">Sırala</span>
      <span className="relative min-w-0 flex-1">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white pl-3 pr-8 text-sm text-navy outline-none transition-colors hover:border-navy/30 focus-visible:border-brand"
          data-testid={dataTestId}
        >
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <ChevronUpDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
      </span>
    </label>
  )
}

export default SortSelect
