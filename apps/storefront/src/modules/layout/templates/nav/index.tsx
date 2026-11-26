import { Suspense } from "react"

import { Heart, Phone, ShoppingCart, User } from "@medusajs/icons"
import { listCategories } from "@lib/data/categories"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { getMegaMenuData } from "@lib/data/mega-menu"
import { listRegions } from "@lib/data/regions"
import { STORE_INFO } from "@lib/store-config"
import { DEFAULT_COUNTRY_CODE } from "@lib/util/site"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import CategoryBar, {
  NavCategory,
} from "@modules/layout/components/category-bar"
import HeaderShell from "@modules/layout/components/header-shell"
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
      fields: "id,name,handle,rank,parent_category_id,metadata",
    }).catch(() => []),
  ])

  // The store API only returns active categories, so hidden (empty) ones
  // never reach the navbar.
  const byRank = (a: { rank?: number | null }, b: { rank?: number | null }) =>
    (a.rank ?? 0) - (b.rank ?? 0)
  const allCategories = categories ?? []
  const topCategories = allCategories
    .filter((c) => !c.parent_category_id)
    .sort(byRank)
  const childrenOf = (parentId: string) =>
    allCategories
      .filter((child) => child.parent_category_id === parentId)
      .sort(byRank)

  const currencyCode =
    regions.find((r) =>
      r.countries?.some((c) => c.iso_2 === DEFAULT_COUNTRY_CODE)
    )?.currency_code ??
    regions[0]?.currency_code ??
    "try"

  const menuData = await getMegaMenuData({
    topCategories: topCategories.map((c) => c.name),
    subCategories: topCategories.flatMap((c) =>
      childrenOf(c.id).map((child) => child.name)
    ),
    currencyCode,
  })

  const categoryTree: NavCategory[] = topCategories.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    count: menuData.counts[c.name] ?? 0,
    featured: menuData.featured[c.name] ?? [],
    children: childrenOf(c.id).map((child) => {
      const image = child.metadata?.image_url

      return {
        id: child.id,
        name: child.name,
        handle: child.handle,
        count: menuData.counts[child.name] ?? 0,
        image:
          (typeof image === "string" && image) ||
          menuData.images[child.name] ||
          null,
      }
    }),
  }))

  // The search box shows category pictures: the category's own image, else
  // its first subcategory's.
  const searchCategories = categoryTree.map((c, i) => {
    const image = topCategories[i].metadata?.image_url

    return {
      name: c.name,
      handle: c.handle,
      image:
        (typeof image === "string" && image) ||
        c.children.find((child) => child.image)?.image ||
        null,
      children: c.children.map((child) => ({
        name: child.name,
        handle: child.handle,
        image: child.image,
      })),
    }
  })

  const menuCategories = categoryTree.map((c) => ({
    name: c.name,
    handle: c.handle,
    children: c.children.map((child) => ({
      name: child.name,
      handle: child.handle,
    })),
  }))

  return (
    // Full width at the top of the page; a floating rounded card once the
    // page scrolls (desktop). No overflow-hidden on the card: the mega menu
    // hangs out of it.
    <HeaderShell>
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
              href="/account/orders"
              className="hover:text-white"
            >
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
      {/* On desktop the category capsule below carries the bottom border and
          the rounded bottom; on mobile this row is the last one, so it does. */}
      <header className="bg-white border-b border-line transition-[border-radius] duration-300 ease-out small:border-b-0 group-data-[scrolled=true]/header:rounded-b-[40px] group-data-[scrolled=true]/header:border-b-0 small:group-data-[scrolled=true]/header:rounded-none">
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
            <Search
              variant="bar"
              categories={searchCategories}
              currencyCode={currencyCode}
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-5 small:gap-x-8 h-full">
            <div className="small:hidden flex items-center">
              <Search
                categories={searchCategories}
                currencyCode={currencyCode}
              />
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

      <CategoryBar categories={categoryTree} currencyCode={currencyCode} />
    </HeaderShell>
  )
}
