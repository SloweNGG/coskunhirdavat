import { USP_ITEMS } from "@lib/store-config"
import StoreIcon from "@modules/common/components/store-icon"

/**
 * Store promises in one bordered card. The 1px gaps over a `bg-line` list
 * draw the dividers, so they stay right at 2, 3 or 6 columns.
 */
const UspStrip = () => {
  return (
    <section className="content-container py-6 small:py-8" aria-label="Neden bizden almalısınız">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line small:grid-cols-3 large:grid-cols-6">
        {USP_ITEMS.map((item) => (
          <li
            key={item.title}
            className="flex flex-col items-start gap-3 bg-white p-4 xsmall:flex-row xsmall:items-center small:px-5 small:py-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-ink ring-1 ring-inset ring-brand-100">
              <StoreIcon name={item.icon} className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold leading-tight text-navy">
                {item.title}
              </span>
              <span className="text-xs leading-snug text-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default UspStrip
