"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import type { SearchClient } from "instantsearch.js"
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch"

import { PART_FINDER_MESSAGE, whatsappLink } from "@lib/store-config"
import useSearchSettled from "@lib/hooks/use-search-settled"
import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import { clx } from "@modules/common/components/ui"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import HitPrice from "@modules/store/components/store-hits/price"
import type { ProductHit } from "./hit"

const MAX_SUGGESTIONS = 6
const MIN_CHARS = 2
const DEBOUNCE_MS = 200

const emptyResult = {
  hits: [],
  nbHits: 0,
  nbPages: 0,
  page: 0,
  hitsPerPage: MAX_SUGGESTIONS,
  processingTimeMS: 0,
  exhaustiveNbHits: true,
  query: "",
  params: "",
}

// The bar is on every page; skip the network for the empty/short query
// InstantSearch sends on mount and while the user has typed under MIN_CHARS.
const suggestClient = {
  ...(searchClient as unknown as SearchClient),
  search: ((requests: { params?: { query?: string } }[]) =>
    requests.every((r) => (r.params?.query ?? "").trim().length < MIN_CHARS)
      ? Promise.resolve({ results: requests.map(() => emptyResult) })
      : (searchClient as unknown as SearchClient).search(
          requests as Parameters<SearchClient["search"]>[0]
        )) as SearchClient["search"],
} as SearchClient

const Combobox = () => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)

  const { query, refine } = useSearchBox()
  const { items: rawItems } = useHits<ProductHit>()
  const { results } = useInstantSearch()
  const { isSettled } = useSearchSettled()

  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const items = rawItems.filter((hit) => hit.handle)
  const trimmed = value.trim()
  const ready = trimmed.length >= MIN_CHARS
  const current = isSettled && query.trim() === trimmed
  const expanded = open && ready
  const productHref = (hit: ProductHit) =>
    `/${countryCode}/products/${hit.handle}`
  const searchHref = (q: string) =>
    `/${countryCode}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`

  useEffect(() => {
    const t = window.setTimeout(
      () => refine(trimmed.length >= MIN_CHARS ? trimmed : ""),
      DEBOUNCE_MS
    )
    return () => window.clearTimeout(t)
  }, [trimmed, refine])

  // Reset highlight on new results and close on navigation, during render
  // rather than in an effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [seen, setSeen] = useState({ query, pathname })
  if (seen.query !== query || seen.pathname !== pathname) {
    if (seen.pathname !== pathname) setOpen(false)
    setActive(-1)
    setSeen({ query, pathname })
  }

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // Chrome clears a search input on Escape; only do that once the list is closed.
      if (expanded) event.preventDefault()
      close()
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      if (!current || !items.length) return
      const step = event.key === "ArrowDown" ? 1 : -1
      // Cycle through -1 (input, nothing highlighted) and each option.
      const n = items.length + 1
      setActive((i) => ((i + 1 + step + n) % n) - 1)
      return
    }
    if (event.key === "Enter" && expanded && current && items[active]) {
      event.preventDefault()
      close()
      router.push(productHref(items[active]))
    }
  }

  const optionId = (i: number) => `${listId}-opt-${i}`

  return (
    <form
      ref={rootRef}
      role="search"
      method="get"
      action={`/${countryCode}/search`}
      onSubmit={(event) => {
        event.preventDefault()
        close()
        router.push(searchHref(trimmed))
      }}
      className="relative w-full"
    >
      <div className="flex h-11 w-full items-center overflow-hidden rounded-lg border-2 border-brand bg-white">
        <input
          type="search"
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Ürün, marka veya kategori ara..."
          aria-label="Ürün ara"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={
            expanded && active >= 0 ? optionId(active) : undefined
          }
          autoComplete="off"
          className="h-full flex-1 bg-transparent px-4 text-sm text-navy outline-none placeholder:text-muted"
          data-testid="nav-search-input"
        />
        <button
          type="submit"
          className="flex h-full items-center gap-x-2 bg-brand px-5 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
          data-testid="nav-search-button"
        >
          <MagnifyingGlass />
          Ara
        </button>
      </div>

      {expanded && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
          <ul
            id={listId}
            role="listbox"
            aria-label="Ürün önerileri"
            data-testid="nav-search-suggestions"
          >
            {current &&
              items.map((hit, i) => (
                <li
                  key={hit.objectID}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                >
                  <Link
                    href={productHref(hit)}
                    tabIndex={-1}
                    onClick={close}
                    className={clx(
                      "flex items-center gap-x-3 px-3 py-2",
                      i === active && "bg-soft"
                    )}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line bg-soft">
                      {hit.thumbnail ? (
                        <Image
                          src={hit.thumbnail}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <PlaceholderImage size={18} />
                        </div>
                      )}
                    </div>
                    <span className="flex-1 line-clamp-2 text-sm text-navy">
                      {hit.title}
                    </span>
                    <span className="shrink-0 [&_p]:text-sm">
                      <HitPrice hit={hit} currencyCode="try" />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>

          {!current ? (
            <p className="px-4 py-3 text-sm text-muted" role="status">
              Aranıyor&hellip;
            </p>
          ) : items.length ? (
            <Link
              href={searchHref(trimmed)}
              onClick={close}
              tabIndex={-1}
              className="block border-t border-line px-4 py-2.5 text-sm font-semibold text-navy hover:bg-soft hover:text-brand-ink"
            >
              Tüm sonuçları gör ({results?.nbHits ?? items.length})
            </Link>
          ) : (
            <div className="px-4 py-3 text-sm" role="status">
              <p className="text-navy">“{trimmed}” için sonuç bulunamadı</p>
              <p className="mt-1 text-muted">
                Aradığınızı bulamadıysanız{" "}
                <a
                  href={whatsappLink(PART_FINDER_MESSAGE)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-ink underline"
                >
                  Parça Bul
                </a>{" "}
                ile fotoğrafını gönderin.
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  )
}

const SearchBar = () => (
  <InstantSearch
    indexName={PRODUCT_INDEX_NAME}
    searchClient={suggestClient}
    future={{ preserveSharedStateOnUnmount: true }}
  >
    <Configure hitsPerPage={MAX_SUGGESTIONS} />
    <Combobox />
  </InstantSearch>
)

export default SearchBar
