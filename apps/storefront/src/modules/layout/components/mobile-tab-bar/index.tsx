"use client"

import { Heart, House, QueueList, ShoppingCart, User } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

const ITEMS = [
  { href: "/", label: "Ana Sayfa", Icon: House },
  { href: "/store", label: "Ürünler", Icon: QueueList },
  { href: "/favoriler", label: "Favoriler", Icon: Heart },
  { href: "/cart", label: "Sepetim", Icon: ShoppingCart },
  { href: "/account", label: "Hesabım", Icon: User },
]

/** Fixed bottom navigation on phones and small tablets. */
const MobileTabBar = () => {
  const pathname = usePathname()
  const countryCode = useParams().countryCode as string
  const path = pathname.replace(`/${countryCode}`, "") || "/"

  return (
    <>
      {/* keeps page content clear of the fixed bar */}
      <div aria-hidden className="h-16 small:hidden" />
      <nav
        aria-label="Alt menü"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] small:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {ITEMS.map(({ href, label, Icon }) => {
            const active =
              href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)
            return (
              <li key={href}>
                <LocalizedClientLink
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clx(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-brand-ink" : "text-navy/70"
                  )}
                >
                  <Icon />
                  {label}
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

export default MobileTabBar
