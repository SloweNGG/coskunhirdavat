"use client"

import {
  ArrowRightMini,
  ArrowUpRightMini,
  Clock,
  MagnifyingGlass,
  Sparkles,
  XMarkMini,
} from "@medusajs/icons"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import {
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  RECENT_KEY,
  RECENT_SEARCHES_KEY,
  useStoredIds,
} from "@lib/hooks/use-stored-ids"
import { highlightParts, nameMatches } from "@lib/search/text"
import {
  CATEGORY_ICONS,
  POPULAR_SEARCHES,
  SEARCH_PLACEHOLDER,
  SEARCH_PLACEHOLDER_WORDS,
  searchHelpMessage,
  whatsappLink,
} from "@lib/store-config"
import StoreIcon from "@modules/common/components/store-icon"
import { clx } from "@modules/common/components/ui"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import HitPrice from "@modules/store/components/store-hits/price"
import {
  type SuggestResponse,
  useDiscovery,
  useSuggestions,
} from "./use-suggestions"
import { useTypewriter } from "./use-typewriter"

/** Placeholder texts typed into the empty box: the usual hint, then products. */
const TYPED_PLACEHOLDERS = [
  SEARCH_PLACEHOLDER,
  ...SEARCH_PLACEHOLDER_WORDS.map((word) => `${word}...`),
]

export type SearchCategory = {
  name: string
  handle: string
  image?: string | null
  children: { name: string; handle: string; image?: string | null }[]
}

type CategoryInfo = {
  name: string
  handle: string
  image: string | null
  parent: string | null
  icon: string
  children: string[]
}

type Hit = SuggestResponse["hits"][number]

type RankedCategory = CategoryInfo & { count: number }

type Option = { href: string; remember?: string }

const MIN_CHARS = 2
const MAX_CATEGORIES = 3
const MAX_RECENT = 5
const MAX_STORED_RECENT = 8
const MAX_CATEGORY_CHIPS = 8
// Product rows next to the recent and popular searches in the empty box.
const DISCOVERY_PRODUCT_ROWS = 4
const MAX_VIEWED_ROWS = 2
// The best few products decide which categories are relevant...
const TOP_HITS_FOR_CATEGORIES = 3
// ...plus any category holding at least this share of all matches.
const MIN_CATEGORY_SHARE = 0.25

/**
 * The categories worth suggesting for a query, from the index's per-category
 * counts. Relevant means named like the query, home to one of the best
 * matches, or holding a good share of all matches; a category where a word
 * only turns up in a couple of descriptions stays out. Named ones come
 * first, then by count. A top-level category gives way to its subcategories
 * (more specific, and the row shows the parent anyway) unless its own name
 * matches.
 */
const rankCategories = (
  search: SuggestResponse,
  lookup: Map<string, CategoryInfo>
): RankedCategory[] => {
  const present = new Set(search.categories.map((facet) => facet.name))
  const ofTopHits = new Set(
    search.hits
      .slice(0, TOP_HITS_FOR_CATEGORIES)
      .flatMap((hit) => (Array.isArray(hit.category) ? hit.category : []))
  )

  return search.categories
    .flatMap((facet) => {
      const info = lookup.get(facet.name)
      return info
        ? [
            {
              ...info,
              count: facet.count,
              named: nameMatches(info.name, search.query),
            },
          ]
        : []
    })
    .filter(
      (category) =>
        category.named ||
        ofTopHits.has(category.name) ||
        category.count >= search.total * MIN_CATEGORY_SHARE
    )
    .filter(
      (category) =>
        category.parent ||
        category.named ||
        !category.children.some((child) => present.has(child))
    )
    .sort((a, b) => Number(b.named) - Number(a.named) || b.count - a.count)
    .slice(0, MAX_CATEGORIES)
}

const asText = (value: unknown) =>
  typeof value === "string" && value ? value : null

/** The product picture on every suggestion row. */
const ProductThumb = ({ src }: { src: string | null }) => (
  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
    {src ? (
      <Image
        src={src}
        alt=""
        fill
        sizes="56px"
        className="object-contain p-1"
        draggable={false}
      />
    ) : (
      <span className="flex h-full w-full items-center justify-center text-muted">
        <PlaceholderImage size={18} />
      </span>
    )}
  </span>
)

const RowSkeleton = () => (
  <div className="flex items-center gap-x-3 px-2 py-2" aria-hidden>
    <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-soft" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-3/4 animate-pulse rounded bg-soft" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-soft" />
    </div>
  </div>
)

const Highlight = ({ text, query }: { text: string; query: string }) => (
  <>
    {highlightParts(text, query).map((part, i) =>
      part.match ? (
        <mark key={i} className="bg-transparent font-semibold text-brand-ink">
          {part.text}
        </mark>
      ) : (
        <Fragment key={i}>{part.text}</Fragment>
      )
    )}
  </>
)

const SectionTitle = ({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) => (
  <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
      {children}
    </p>
    {action}
  </div>
)

const chipClass = (active: boolean) =>
  clx(
    "inline-flex h-8 items-center gap-x-1.5 rounded-full border px-3 text-sm transition-colors",
    active
      ? "border-brand/50 bg-brand-50 text-brand-ink"
      : "border-line bg-white text-navy"
  )

const rowClass = (active: boolean) =>
  clx(
    "flex items-center gap-x-3 rounded-xl px-2 py-2 transition-colors",
    active && "bg-brand-50"
  )

type SearchBoxProps = {
  categories: SearchCategory[]
  currencyCode: string
  /** "bar": header field with a dropdown. "sheet": field and list inside the mobile drawer. */
  variant?: "bar" | "sheet"
  /** Called after any navigation, e.g. to close the drawer. */
  onNavigate?: () => void
}

/**
 * The store's search box. Empty, it offers recent searches, popular searches
 * (each with a product picture), recently viewed and popular products, and
 * categories; typing shows matching categories (with product counts) and
 * products with pictures and prices, the typed words highlighted. A query that finds nothing is
 * retried with typos corrected against the catalog ("lazr" -> "lazer").
 * Fully keyboard driven (arrows, Enter, Escape, "/" to focus on desktop).
 */
const SearchBox = ({
  categories,
  currencyCode,
  variant = "bar",
  onNavigate,
}: SearchBoxProps) => {
  const isBar = variant === "bar"
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  // Product names are typed into the placeholder while the box is empty and
  // not focused; focused, it shows the plain hint.
  const [focused, setFocused] = useState(false)
  const typedPlaceholder = useTypewriter(TYPED_PLACEHOLDERS, !value && !focused)

  const {
    ids: storedRecent,
    push,
    toggle,
    clear,
  } = useStoredIds(RECENT_SEARCHES_KEY, MAX_STORED_RECENT)
  const recent = storedRecent.slice(0, MAX_RECENT)
  const { ids: storedViewed } = useStoredIds(RECENT_KEY, 20)
  // Hovering the field starts loading the empty box's pictures early.
  const [warm, setWarm] = useState(false)

  const trimmed = value.trim()
  const typing = trimmed.length >= MIN_CHARS
  const visible = isBar ? open : true
  const { data, current, error } = useSuggestions(
    typing && visible ? trimmed : null,
    currencyCode
  )
  const discovery = useDiscovery(
    storedViewed.slice(0, DISCOVERY_PRODUCT_ROWS),
    currencyCode,
    warm || (visible && !typing)
  )

  const lookup = useMemo(() => {
    const map = new Map<string, CategoryInfo>()
    for (const top of categories) {
      const icon = CATEGORY_ICONS[top.handle] ?? "default"
      map.set(top.name, {
        name: top.name,
        handle: top.handle,
        image: top.image ?? null,
        parent: null,
        icon,
        children: top.children.map((child) => child.name),
      })
      for (const child of top.children) {
        if (!map.has(child.name)) {
          map.set(child.name, {
            name: child.name,
            handle: child.handle,
            image: child.image ?? null,
            parent: top.name,
            icon,
            children: [],
          })
        }
      }
    }
    return map
  }, [categories])

  const searchHref = (q: string) =>
    `/${countryCode}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`
  const productHref = (handle: string) => `/${countryCode}/products/${handle}`
  const categoryHref = (handle: string) =>
    `/${countryCode}/categories/${handle}`

  // Stale answers stay on screen (dimmed) while the next query loads, unless
  // they had nothing to show.
  const shown = data && (current || data.total > 0) ? data : null
  // What "all results" searches: the corrected query once it has answered.
  const effectiveQuery = current && shown ? shown.query : trimmed
  const rankedCategories = shown ? rankCategories(shown, lookup) : []
  const linkable = (hits: Hit[]) => hits.filter((hit) => asText(hit.handle))
  const products = linkable(shown?.hits ?? [])
  const noResults = Boolean(current && data && data.total === 0)
  const topCategories = categories.slice(0, MAX_CATEGORY_CHIPS)

  // Empty box: a couple of recently viewed products, popular ones after.
  const popularProducts = linkable(discovery.data?.popularProducts ?? [])
  const viewedProducts = linkable(discovery.data?.viewed ?? []).slice(
    0,
    popularProducts.length ? MAX_VIEWED_ROWS : DISCOVERY_PRODUCT_ROWS
  )
  const viewedIds = new Set(viewedProducts.map((hit) => hit.id))
  const shownPopular = popularProducts
    .filter((hit) => !viewedIds.has(hit.id))
    .slice(0, DISCOVERY_PRODUCT_ROWS - viewedProducts.length)
  const discoveryLoading = !discovery.data && !discovery.failed
  const hasDiscoveryProducts =
    discoveryLoading || viewedProducts.length + shownPopular.length > 0
  const termThumbnails = new Map(
    (discovery.data?.popularTerms ?? []).map((t) => [t.term, t.thumbnail])
  )

  // Every selectable row, in screen order, for the arrow keys.
  const options: Option[] = []
  const add = (option: Option) => options.push(option) - 1

  const expanded =
    visible &&
    (typing ||
      recent.length > 0 ||
      POPULAR_SEARCHES.length > 0 ||
      topCategories.length > 0)

  // Reset the highlight when the list changes; close on navigation. Done
  // during render rather than in an effect
  // (https://react.dev/learn/you-might-not-need-an-effect).
  const view = `${trimmed}|${current}|${open}`
  const [seen, setSeen] = useState({ view, pathname })
  if (seen.view !== view || seen.pathname !== pathname) {
    if (seen.pathname !== pathname) setOpen(false)
    setActive(-1)
    setSeen({ view, pathname })
  }

  useEffect(() => {
    if (!isBar || !open) return
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isBar, open])

  // "/" focuses the header search from anywhere on the page.
  useEffect(() => {
    if (!isBar) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target?.isContentEditable ||
        target?.closest("input, textarea, select")
      ) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isBar])

  useEffect(() => {
    if (active < 0) return
    document
      .getElementById(`${listId}-opt-${active}`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active, listId])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const remember = (term?: string) => {
    const normalized = term?.trim().toLocaleLowerCase("tr")
    if (normalized && normalized.length >= MIN_CHARS) push(normalized)
  }

  const finish = (option: Option) => {
    remember(option.remember)
    close()
    // Drop focus so the field doesn't reopen the list on the next page.
    const focused = document.activeElement
    if (
      focused instanceof HTMLElement &&
      focused.getAttribute("role") === "combobox"
    ) {
      focused.blur()
    }
    onNavigate?.()
  }

  const go = (option: Option) => {
    finish(option)
    router.push(option.href)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && isBar) {
      // Chrome clears a search input on Escape; only do that once the list is closed.
      if (open) event.preventDefault()
      close()
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      if (!options.length) return
      const step = event.key === "ArrowDown" ? 1 : -1
      // Cycle through -1 (the input, nothing highlighted) and each option.
      const n = options.length + 1
      setActive((i) => ((i + 1 + step + n) % n) - 1)
      return
    }
    if (event.key === "Enter" && expanded && options[active]) {
      event.preventDefault()
      go(options[active])
    }
  }

  const optionProps = (index: number, option: Option) => ({
    id: `${listId}-opt-${index}`,
    role: "option" as const,
    "aria-selected": index === active,
    href: option.href,
    tabIndex: -1,
    // Rows change with every keystroke; prefetching each would flood the server.
    prefetch: false,
    onClick: () => finish(option),
    onMouseMove: () => {
      if (active !== index) setActive(index)
    },
  })

  /**
   * A product with its picture. "inline" puts the price on the right (search
   * results); "stacked" puts it under the title (the narrower empty-box column).
   */
  const productRow = (
    hit: Hit,
    remember: string | undefined,
    layout: "inline" | "stacked",
    query?: string
  ) => {
    const option = { href: productHref(asText(hit.handle) ?? ""), remember }
    const index = add(option)
    const title = asText(hit.title) ?? ""
    const price = (
      <span className="shrink-0 [&_p]:text-sm">
        <HitPrice hit={hit} currencyCode={currencyCode} />
      </span>
    )

    return (
      <li key={hit.id}>
        <Link
          {...optionProps(index, option)}
          className={rowClass(index === active)}
        >
          <ProductThumb src={asText(hit.thumbnail)} />
          {layout === "inline" ? (
            <>
              <span className="min-w-0 flex-1 line-clamp-2 text-sm leading-snug text-navy">
                {query ? <Highlight text={title} query={query} /> : title}
              </span>
              {price}
            </>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm leading-snug text-navy">
                {title}
              </span>
              <span className="mt-0.5 block">{price}</span>
            </span>
          )}
        </Link>
      </li>
    )
  }

  const categoryChips = (title: string) => (
    <div role="group" aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {topCategories.map((category) => {
          const option = { href: categoryHref(category.handle) }
          const index = add(option)
          return (
            <Link
              key={category.handle}
              {...optionProps(index, option)}
              className={chipClass(index === active)}
            >
              <StoreIcon
                name={CATEGORY_ICONS[category.handle] ?? "default"}
                className="h-4 w-4 text-brand-ink"
              />
              {category.name}
            </Link>
          )
        })}
      </div>
    </div>
  )

  let body: ReactNode
  let footer: ReactNode = null

  if (!typing) {
    body = (
      <div
        className={clx(
          // Wide screens: searches and categories on the left, products with
          // pictures on the right. Narrower ones stack in source order.
          isBar &&
            hasDiscoveryProducts &&
            "medium:grid medium:grid-cols-2 medium:grid-rows-[auto_1fr]"
        )}
      >
        <div className="min-w-0 medium:col-start-1 medium:row-start-1">
          {recent.length > 0 && (
            <div role="group" aria-label="Son aramalar">
              <SectionTitle
                action={
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs font-medium text-muted hover:text-navy"
                  >
                    Temizle
                  </button>
                }
              >
                Son aramalar
              </SectionTitle>
              <ul className="px-2">
                {recent.map((term) => {
                  const option = { href: searchHref(term), remember: term }
                  const index = add(option)
                  return (
                    <li key={term} className="group/recent relative">
                      <Link
                        {...optionProps(index, option)}
                        className={clx(
                          rowClass(index === active),
                          "pr-10 text-sm text-navy"
                        )}
                      >
                        <Clock className="shrink-0 text-muted" />
                        <span className="truncate">{term}</span>
                      </Link>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => toggle(term)}
                        aria-label={`"${term}" aramasını sil`}
                        className={clx(
                          "absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-opacity hover:bg-black/5 hover:text-navy",
                          index !== active &&
                            "small:opacity-0 small:group-hover/recent:opacity-100"
                        )}
                      >
                        <XMarkMini />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {POPULAR_SEARCHES.length > 0 && (
            <div role="group" aria-label="Popüler aramalar">
              <SectionTitle>Popüler aramalar</SectionTitle>
              <div className="flex flex-wrap gap-2 px-4 pb-1">
                {POPULAR_SEARCHES.map((term) => {
                  const option = { href: searchHref(term), remember: term }
                  const index = add(option)
                  const thumbnail = termThumbnails.get(term)
                  return (
                    <Link
                      key={term}
                      {...optionProps(index, option)}
                      className={clx(
                        chipClass(index === active),
                        "h-9",
                        thumbnail && "pl-1"
                      )}
                    >
                      {thumbnail ? (
                        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-line bg-white">
                          <Image
                            src={thumbnail}
                            alt=""
                            fill
                            sizes="28px"
                            className="object-contain p-0.5"
                            draggable={false}
                          />
                        </span>
                      ) : (
                        <ArrowUpRightMini className="text-brand-ink" />
                      )}
                      {term}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {hasDiscoveryProducts && (
          <div className="min-w-0 pb-1 medium:col-start-2 medium:row-span-2 medium:row-start-1 medium:border-l medium:border-line">
            {discoveryLoading ? (
              <>
                <SectionTitle>Popüler ürünler</SectionTitle>
                <div className="px-2">
                  {[0, 1, 2].map((i) => (
                    <RowSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                {viewedProducts.length > 0 && (
                  <div role="group" aria-label="Son baktığınız ürünler">
                    <SectionTitle>Son baktığınız ürünler</SectionTitle>
                    <ul className="px-2">
                      {viewedProducts.map((hit) =>
                        productRow(hit, undefined, "stacked")
                      )}
                    </ul>
                  </div>
                )}
                {shownPopular.length > 0 && (
                  <div role="group" aria-label="Popüler ürünler">
                    <SectionTitle>Popüler ürünler</SectionTitle>
                    <ul className="px-2">
                      {shownPopular.map((hit) =>
                        productRow(hit, undefined, "stacked")
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {topCategories.length > 0 && (
          <div className="min-w-0 medium:col-start-1 medium:row-start-2">
            {categoryChips("Kategoriler")}
          </div>
        )}
      </div>
    )
  } else if (error && !current) {
    body = (
      <p className="px-4 py-4 text-sm text-muted" role="status">
        Öneriler şu an yüklenemedi. Tüm sonuçlar için Enter’a basın.
      </p>
    )
  } else if (noResults) {
    body = (
      <>
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-navy">
            “{trimmed}” için sonuç bulunamadı
          </p>
          <p className="mt-1 text-sm text-muted">
            Yazımı kontrol edin ya da daha genel bir kelime deneyin.
          </p>
          <a
            href={whatsappLink(searchHelpMessage(trimmed))}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-9 items-center gap-x-2 rounded-full bg-whatsapp px-4 text-sm font-semibold text-navy transition-colors hover:bg-whatsapp-dark"
          >
            <StoreIcon name="chat" className="h-4 w-4" />
            WhatsApp’tan sorun, sizin için bulalım
          </a>
        </div>
        {topCategories.length > 0 && categoryChips("Kategorilere göz atın")}
      </>
    )
  } else if (shown) {
    body = (
      <div
        className={clx(
          "transition-opacity duration-150",
          !current && "opacity-60"
        )}
      >
        {shown.correctedFrom && (
          <div className="mx-2 mb-1 mt-1 flex items-start gap-x-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-navy">
            <Sparkles className="mt-px shrink-0 text-brand-ink" />
            <p>
              “{shown.correctedFrom}” için sonuç yok,{" "}
              <strong className="font-semibold text-brand-ink">
                “{shown.query}”
              </strong>{" "}
              sonuçları gösteriliyor.
            </p>
          </div>
        )}

        {rankedCategories.length > 0 && (
          <div role="group" aria-label="Kategoriler">
            <SectionTitle>Kategoriler</SectionTitle>
            <ul className="px-2">
              {rankedCategories.map((category) => {
                const option = {
                  href: categoryHref(category.handle),
                  remember: shown.query,
                }
                const index = add(option)
                return (
                  <li key={category.handle}>
                    <Link
                      {...optionProps(index, option)}
                      className={rowClass(index === active)}
                    >
                      {category.image ? (
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                          <Image
                            src={category.image}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                            draggable={false}
                          />
                        </span>
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-ink">
                          <StoreIcon name={category.icon} className="h-5 w-5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-navy">
                          <Highlight text={category.name} query={shown.query} />
                        </span>
                        {category.parent && (
                          <span className="block truncate text-xs text-muted">
                            {category.parent}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium text-muted">
                        {category.count} ürün
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {products.length > 0 && (
          <div role="group" aria-label="Ürünler">
            <SectionTitle>Ürünler</SectionTitle>
            <ul className="px-2">
              {products.map((hit) =>
                productRow(hit, shown.query, "inline", shown.query)
              )}
            </ul>
          </div>
        )}
      </div>
    )
  } else {
    body = (
      <div className="px-2 py-2">
        {[0, 1, 2].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (typing && !noResults) {
    const option = {
      href: searchHref(effectiveQuery),
      remember: effectiveQuery,
    }
    const index = add(option)
    footer = (
      <Link
        {...optionProps(index, option)}
        className={clx(
          "flex items-center justify-between gap-x-3 border-t border-line px-4 py-3 text-sm font-semibold text-navy transition-colors",
          index === active && "bg-brand-50"
        )}
        data-testid="nav-search-all"
      >
        <span className="flex min-w-0 items-center gap-x-2">
          <MagnifyingGlass className="shrink-0 text-brand-ink" />
          <span className="truncate">“{effectiveQuery}” için tüm sonuçlar</span>
        </span>
        <span className="flex shrink-0 items-center gap-x-1 text-brand-ink">
          {current && shown ? `${shown.total} ürün` : "Gör"}
          <ArrowRightMini />
        </span>
      </Link>
    )
  }

  const status = !typing
    ? ""
    : current && data
    ? data.total
      ? `${data.total} ürün bulundu`
      : "Sonuç bulunamadı"
    : "Aranıyor"

  const listbox = (
    <div
      id={listId}
      role="listbox"
      aria-label="Arama önerileri"
      data-testid="nav-search-suggestions"
      className={clx(!isBar && "flex min-h-0 flex-1 flex-col")}
    >
      <div
        className={clx(
          "overflow-y-auto overscroll-contain py-1",
          isBar ? "max-h-[min(75vh,640px)]" : "min-h-0 flex-1"
        )}
      >
        {body}
      </div>
      {footer}
    </div>
  )

  return (
    <form
      ref={rootRef}
      role="search"
      method="get"
      action={`/${countryCode}/search`}
      onSubmit={(event) => {
        event.preventDefault()
        if (!trimmed) {
          inputRef.current?.focus()
          setOpen(true)
          return
        }
        go({ href: searchHref(trimmed), remember: trimmed })
      }}
      onBlur={(event) => {
        if (
          isBar &&
          !rootRef.current?.contains(event.relatedTarget as Node | null)
        ) {
          close()
        }
      }}
      className={clx(
        "relative w-full",
        !isBar && "flex min-h-0 flex-1 flex-col"
      )}
    >
      <div className={clx(!isBar && "border-b border-line p-4")}>
        <div
          onPointerEnter={() => setWarm(true)}
          className="group/search flex h-12 items-center rounded-full border border-brand/25 bg-brand-50 p-1 pl-4 transition-[background-color,border-color,box-shadow] duration-150 hover:border-brand/50 focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/15"
        >
          <MagnifyingGlass className="shrink-0 text-brand-ink" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              setOpen(true)
              setFocused(true)
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            placeholder={typedPlaceholder ?? SEARCH_PLACEHOLDER}
            aria-label="Ürün ara"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={
              expanded && active >= 0 ? `${listId}-opt-${active}` : undefined
            }
            autoComplete="off"
            autoFocus={!isBar}
            enterKeyHint="search"
            className="h-full w-0 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-navy outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
            data-testid={isBar ? "nav-search-input" : "search-input"}
          />
          {value ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue("")
                setOpen(true)
                inputRef.current?.focus()
              }}
              aria-label="Aramayı temizle"
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-navy"
            >
              <XMarkMini />
            </button>
          ) : (
            isBar && (
              <kbd
                className="mr-2 hidden h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-brand/25 bg-white px-1.5 font-mono text-xs text-muted medium:flex group-focus-within/search:hidden"
                title="Aramaya geçmek için / tuşuna basın"
              >
                /
              </kbd>
            )
          )}
          <button
            type="submit"
            className="flex h-full shrink-0 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg shadow-sm transition-colors hover:bg-brand-dark"
            data-testid="nav-search-button"
          >
            Ara
          </button>
        </div>
      </div>

      <p role="status" className="sr-only">
        {status}
      </p>

      {isBar
        ? expanded && (
            <div
              // Keep focus in the input while clicking inside the list.
              onMouseDown={(event) => event.preventDefault()}
              className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white text-navy shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-line"
            >
              {listbox}
            </div>
          )
        : listbox}
    </form>
  )
}

export default SearchBox
