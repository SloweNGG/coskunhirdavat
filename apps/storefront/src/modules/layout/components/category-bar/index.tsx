"use client"

import {
  ArrowRightMini,
  BarsThree,
  ChevronDownMini,
  ChevronRightMini,
} from "@medusajs/icons"
import Image from "next/image"
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react"

import type { MenuProduct } from "@lib/data/mega-menu"
import { indexedCurrency } from "@lib/search-client"
import {
  CATEGORY_ICONS,
  MENU_HELP_MESSAGE,
  USP_ITEMS,
  whatsappLink,
} from "@lib/store-config"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PriceText from "@modules/common/components/price-text"
import StoreIcon from "@modules/common/components/store-icon"
import { clx } from "@modules/common/components/ui"

export type NavSubcategory = {
  id: string
  name: string
  handle: string
  count: number
  image: string | null
}

export type NavCategory = {
  id: string
  name: string
  handle: string
  count: number
  children: NavSubcategory[]
  featured: MenuProduct[]
}

// Grace period before the menu closes, so crossing a small gap with the
// pointer doesn't flicker it shut.
const CLOSE_DELAY_MS = 150

/** Points the hovered `.glow-card`'s light at the pointer (see globals.css). */
const trackGlow = (event: ReactPointerEvent<HTMLElement>) => {
  const card = (event.target as HTMLElement).closest<HTMLElement>(".glow-card")
  if (!card) {
    return
  }
  const rect = card.getBoundingClientRect()
  card.style.setProperty("--glow-x", `${event.clientX - rect.left}px`)
  card.style.setProperty("--glow-y", `${event.clientY - rect.top}px`)
}

const MenuPrice = ({
  product,
  currencyCode,
}: {
  product: MenuProduct
  currencyCode: string
}) => {
  if (product.minPrice === null) {
    return null
  }

  const currency_code = indexedCurrency(currencyCode)
  const isRange = (product.maxPrice ?? product.minPrice) > product.minPrice

  return (
    <span className="mt-1 block text-sm font-bold text-brand-ink">
      <PriceText
        value={convertToLocale({ amount: product.minPrice, currency_code })}
      />
      {isRange && (
        <span className="text-xs font-medium text-muted">’den başlayan</span>
      )}
    </span>
  )
}

const CategoryPanel = ({
  category,
  active,
  currencyCode,
  onNavigate,
}: {
  category: NavCategory
  active: boolean
  currencyCode: string
  onNavigate: () => void
}) => {
  const hasFeatured = category.featured.length > 0
  const icon = CATEGORY_ICONS[category.handle] ?? "default"

  return (
    <div
      className={clx(
        "min-w-0 gap-x-8",
        active ? "grid" : "hidden",
        hasFeatured && "medium:grid-cols-[1fr_280px]"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-x-4">
          <div>
            <p className="text-xl font-bold text-navy">{category.name}</p>
            {category.count > 0 && (
              <p className="mt-0.5 text-sm text-muted">{category.count} ürün</p>
            )}
          </div>
          <LocalizedClientLink
            href={`/categories/${category.handle}`}
            onClick={onNavigate}
            className="flex shrink-0 items-center gap-x-1 text-sm font-semibold text-brand-ink hover:text-navy"
          >
            Tümünü gör
            <ArrowRightMini />
          </LocalizedClientLink>
        </div>

        {category.children.length > 0 ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 large:grid-cols-3">
            {category.children.map((child) => (
              <li key={child.id}>
                <LocalizedClientLink
                  href={`/categories/${child.handle}`}
                  onClick={onNavigate}
                  className="glow-card group/card flex h-full items-center gap-x-3 rounded-xl border border-line bg-white p-2.5 transition-[border-color,box-shadow] duration-200 hover:border-brand/30 hover:shadow-[0_12px_28px_-14px_rgb(var(--brand)/0.55)]"
                >
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft text-brand-ink">
                    {child.image ? (
                      <Image
                        src={child.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1 transition-transform duration-300 group-hover/card:scale-110"
                      />
                    ) : (
                      <StoreIcon name={icon} className="h-6 w-6" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug text-navy group-hover/card:text-brand-ink">
                      {child.name}
                    </span>
                    {child.count > 0 && (
                      <span className="mt-0.5 block text-xs text-muted">
                        {child.count} ürün
                      </span>
                    )}
                  </span>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        ) : (
          <LocalizedClientLink
            href={`/categories/${category.handle}`}
            onClick={onNavigate}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
          >
            Ürünleri incele
          </LocalizedClientLink>
        )}
      </div>

      {hasFeatured && (
        <div className="hidden border-l border-line pl-8 medium:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
            Öne çıkanlar
          </p>
          <ul className="mt-3 flex flex-col gap-y-2">
            {category.featured.map((product) => (
              <li key={product.id}>
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  onClick={onNavigate}
                  className="glow-card group/product -mx-2 flex items-center gap-x-3 rounded-xl border border-transparent p-2 transition-shadow duration-200 hover:shadow-[0_12px_28px_-14px_rgb(var(--brand)/0.55)]"
                >
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                    {product.thumbnail && (
                      <Image
                        src={product.thumbnail}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-contain p-1 transition-transform duration-300 group-hover/product:scale-110"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-navy group-hover/product:text-brand-ink">
                      {product.title}
                    </span>
                    <MenuPrice product={product} currencyCode={currencyCode} />
                  </span>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Desktop category bar with one shared mega menu. Hovering (or focusing) a
 * category in the bar opens the menu on that category; "Tüm Kategoriler"
 * opens it on the last one shown (the first, initially). Inside, the left rail switches categories,
 * the middle lists subcategories with a picture and product count, and the
 * right shows a few featured products. Every category's content is rendered,
 * only the active one is shown, so all links are in the page for crawlers.
 */
const CategoryBar = ({
  categories,
  currencyCode,
}: {
  categories: NavCategory[]
  currencyCode: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  // Which bar button opened the menu, so only that one is highlighted.
  const [openedFromAll, setOpenedFromAll] = useState(false)
  const [activeId, setActiveId] = useState(categories[0]?.id ?? null)
  const closeTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const cancelClose = () => window.clearTimeout(closeTimer.current)

  const open = (id: string | null) => {
    cancelClose()
    if (id) {
      setActiveId(id)
    }
    setOpenedFromAll(id === null)
    setIsOpen(true)
  }

  const close = () => {
    cancelClose()
    setIsOpen(false)
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(
      () => setIsOpen(false),
      CLOSE_DELAY_MS
    )
  }

  if (!categories.length) {
    return null
  }

  return (
    <nav
      className="relative hidden border-b border-line bg-white transition-[border-radius] duration-300 ease-out small:block group-data-[scrolled=true]/header:rounded-b-[40px] group-data-[scrolled=true]/header:border-b-0"
      aria-label="Kategoriler"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close()
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          close()
        }
      }}
    >
      {/* Floating capsule: a rounded, lightly tinted track the categories sit in as pills. */}
      <div className="content-container pb-3 pt-1">
        <div className="flex items-center gap-x-1 rounded-full border border-brand/20 bg-brand-100 p-1">
          <LocalizedClientLink
            href="/store"
            onMouseEnter={() => open(null)}
            onFocus={() => open(null)}
            onClick={close}
            className={clx(
              "flex h-9 shrink-0 items-center gap-x-2 whitespace-nowrap rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg shadow-sm transition-colors hover:bg-brand-dark",
              isOpen && openedFromAll && "bg-brand-dark"
            )}
            aria-haspopup="true"
            aria-expanded={isOpen && openedFromAll}
          >
            <BarsThree />
            Tüm Kategoriler
          </LocalizedClientLink>

          {/* Categories that don't fit wrap to a second row, pushed out of
            view by the row gap and clipped. The 2px padding leaves room for
            the hovered pill's shadow. */}
          <ul className="flex h-10 min-w-0 flex-1 flex-wrap gap-x-0.5 gap-y-4 overflow-hidden py-0.5">
            {categories.map((category) => {
              const isCurrent =
                isOpen && !openedFromAll && activeId === category.id

              return (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    onMouseEnter={() => open(category.id)}
                    onFocus={() => open(category.id)}
                    onClick={close}
                    className={clx(
                      "flex h-9 items-center gap-x-1 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150",
                      isCurrent
                        ? "bg-white text-brand-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                        : "text-navy/80 hover:bg-white hover:text-navy"
                    )}
                    data-testid="nav-category-link"
                    aria-haspopup="true"
                    aria-expanded={isCurrent}
                  >
                    {category.name}
                    <ChevronDownMini
                      className={clx(
                        "transition-transform duration-150",
                        isCurrent ? "rotate-180 text-brand-ink" : "text-muted"
                      )}
                      aria-hidden
                    />
                  </LocalizedClientLink>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* The menu is its own rounded card below the header, as wide as the
          page content. The outer layer's top padding bridges the gap, so the
          pointer never leaves the nav on the way down. */}
      <div
        className={clx(
          "absolute inset-x-0 top-full z-40 mx-auto max-w-[1440px] px-6 pt-2 text-navy transition-[opacity,visibility] duration-150",
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div
          onPointerMove={trackGlow}
          className="rounded-2xl bg-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-line"
        >
          <div className="content-container grid grid-cols-[230px_1fr] gap-x-8 py-6 medium:grid-cols-[250px_1fr]">
            <ul className="flex flex-col gap-y-1 self-start rounded-xl bg-soft p-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    onMouseEnter={() => setActiveId(category.id)}
                    onFocus={() => setActiveId(category.id)}
                    onClick={close}
                    className={clx(
                      "flex items-center justify-between gap-x-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      category.id === activeId
                        ? "bg-white text-brand-ink shadow-sm"
                        : "text-navy hover:bg-white/70"
                    )}
                  >
                    <span className="min-w-0">{category.name}</span>
                    <ChevronRightMini className="shrink-0 text-muted" />
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>

            {categories.map((category) => (
              <CategoryPanel
                key={category.id}
                category={category}
                active={category.id === activeId}
                currencyCode={currencyCode}
                onNavigate={close}
              />
            ))}
          </div>

          <div className="border-t border-line">
            <div className="content-container flex items-center justify-between gap-x-6 py-3 text-sm">
              <ul className="flex items-center gap-x-6 text-muted">
                {USP_ITEMS.slice(0, 3).map((item) => (
                  <li key={item.title} className="flex items-center gap-x-2">
                    <StoreIcon
                      name={item.icon}
                      className="h-4 w-4 text-brand-ink"
                    />
                    {item.title}
                  </li>
                ))}
              </ul>
              <a
                href={whatsappLink(MENU_HELP_MESSAGE)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-x-1.5 font-semibold text-whatsapp-ink hover:text-navy"
              >
                Doğru ürünü bulamadınız mı? WhatsApp’tan sorun
                <ArrowRightMini />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default CategoryBar
