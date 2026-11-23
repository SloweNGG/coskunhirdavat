import { Suspense } from "react"

import { BarsThree, Camera, Heart, ListCheckbox, Phone, ShoppingCart, User } from "@medusajs/icons"
import { listCategories } from "@lib/data/categories"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { PART_FINDER_MESSAGE, STORE_INFO, whatsappLink } from "@lib/store-config"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import AnniversaryBadge from "@modules/layout/components/anniversary-badge"
import Logo from "@modules/layout/components/logo"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listCategories({
      fields: "id,name,handle,rank,parent_category_id",
    }).catch(() => []),
  ])

  const topCategories = (categories ?? [])
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  const menuCategories = topCategories.map((c) => ({
    name: c.name,
    handle: c.handle,
  }))

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* Top bar */}
      <div className="hidden small:block bg-navy text-white/85 text-xs">
        <div className="content-container flex h-9 items-center justify-between">
          <div className="flex items-center gap-x-6">
            <span>{STORE_INFO.installmentText}</span>
            <span className="h-3 w-px bg-white/25" />
            <span>{STORE_INFO.freeShippingText}</span>
          </div>
          <div className="flex items-center gap-x-6">
            <LocalizedClientLink
              href="/projeler"
              className="flex items-center gap-x-1.5 font-semibold text-brand-bright hover:text-white"
            >
              <ListCheckbox />
              Ne Yapacaksınız?
            </LocalizedClientLink>
            <a
              href={whatsappLink(PART_FINDER_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-x-1.5 font-semibold text-brand-bright hover:text-white"
            >
              <Camera />
              Parça Bul
            </a>
            <span className="h-3 w-px bg-white/25" />
            <LocalizedClientLink href="/account/orders" className="hover:text-white">
              Siparişlerim
            </LocalizedClientLink>
            <LocalizedClientLink href="/contact" className="hover:text-white">
              İletişim
            </LocalizedClientLink>
            <a
              href={STORE_INFO.phoneHref}
              className="flex items-center gap-x-1.5 font-semibold text-brand-bright"
            >
              <Phone />
              {STORE_INFO.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main row */}
      <header className="bg-white border-b border-line">
        <div className="content-container flex h-16 small:h-20 items-center gap-x-4 small:gap-x-10">
          <div className="small:hidden flex items-center h-full">
            <SideMenu
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
              categories={menuCategories}
            />
          </div>

          <div className="flex items-center small:flex-1">
            <Logo />
            <AnniversaryBadge className="ml-4 hidden text-navy medium:block" />
          </div>

          <div className="hidden small:flex w-full max-w-[720px]">
            <Search variant="bar" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-5 small:gap-x-8 h-full">
            <div className="small:hidden flex items-center">
              <Search />
            </div>
            <LocalizedClientLink
              className="hidden small:flex items-center gap-x-2 text-navy hover:text-brand-ink"
              href="/favoriler"
              aria-label="Favorilerim"
              title="Favorilerim"
            >
              <Heart className="h-6 w-6" />
            </LocalizedClientLink>
            <LocalizedClientLink
              className="flex items-center gap-x-2 text-navy hover:text-brand-ink"
              href="/account"
              data-testid="nav-account-link"
              aria-label="Hesabım"
              title="Hesabım"
            >
              <User className="h-6 w-6" />
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="flex items-center gap-x-2 text-navy"
                  href="/cart"
                  data-testid="nav-cart-link"
                  aria-label="Sepetim"
                >
                  <ShoppingCart className="h-6 w-6" />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Category bar */}
      <nav className="hidden small:block bg-navy text-white">
        <div className="content-container flex h-12 items-center gap-x-1">
          <LocalizedClientLink
            href="/store"
            className="flex h-full shrink-0 items-center gap-x-2 whitespace-nowrap bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
          >
            <BarsThree />
            Tüm Ürünler
          </LocalizedClientLink>
          <ul className="flex h-full items-center overflow-x-auto no-scrollbar">
            {topCategories.map((c) => (
              <li key={c.id} className="h-full">
                <LocalizedClientLink
                  href={`/categories/${c.handle}`}
                  className="flex h-full items-center whitespace-nowrap px-3 large:px-4 text-sm font-medium hover:bg-white/10 hover:text-brand-bright"
                  data-testid="nav-category-link"
                >
                  {c.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  )
}
