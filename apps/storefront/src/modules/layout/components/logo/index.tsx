import { Tools } from "@medusajs/icons"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

/** Text logo used until the store has a real logo file. */
const Logo = ({ inverted = false }: { inverted?: boolean }) => {
  return (
    <LocalizedClientLink
      href="/"
      className="flex items-center gap-x-2.5 shrink-0"
      data-testid="nav-store-link"
      aria-label={STORE_INFO.name}
    >
      <span
        className={clx(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          "bg-brand text-brand-fg"
        )}
      >
        <Tools className="h-6 w-6" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={clx(
            "text-xl font-bold tracking-tight",
            inverted ? "text-white" : "text-navy"
          )}
        >
          {STORE_INFO.shortName}
        </span>
        <span
          className={clx(
            "text-[11px] font-semibold uppercase tracking-[0.2em]",
            inverted ? "text-brand-bright" : "text-brand-ink"
          )}
        >
          Hırdavat
        </span>
      </span>
    </LocalizedClientLink>
  )
}

export default Logo
