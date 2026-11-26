"use client"

import type { Hit } from "instantsearch.js"
import { useEffect, useRef } from "react"
import { useHits, useInstantSearch } from "react-instantsearch"

import useSearchSettled from "@lib/hooks/use-search-settled"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import OutOfStockWhatsApp, {
  OutOfStockBadge,
  CardButtonLabel,
  OUT_OF_STOCK_BUTTON_GAP,
} from "@modules/products/components/out-of-stock-whatsapp"
import Thumbnail from "@modules/products/components/thumbnail"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SearchPagination from "./pagination"
import HitPrice, { HitPricing } from "./price"
import { useOutOfStockHandles } from "./use-out-of-stock"
import { priceAttribute } from "@lib/search-client"
import FreeShippingBadge, {
  qualifiesForFreeShipping,
} from "@modules/common/components/free-shipping-badge"

type ProductHit = Hit<
  {
    title: string | null
    handle: string | null
    thumbnail: string | null
  } & HitPricing
>

type StoreHitsProps = {
  hitsPerPage: number
  currencyCode: string
}

const StoreHits = ({ hitsPerPage, currencyCode }: StoreHitsProps) => {
  const { items } = useHits<ProductHit>()
  const outOfStock = useOutOfStockHandles(items.map((hit) => hit.handle))
  const { status, error, indexUiState } = useInstantSearch()
  const { isSearching, hasNoResultsYet } = useSearchSettled()

  const { page, ...refinements } = indexUiState
  const currentPage = page ?? 1
  const refinementKey = JSON.stringify(refinements)

  const settled = useRef({ page: currentPage, refinementKey })

  useEffect(() => {
    if (!isSearching) {
      settled.current = { page: currentPage, refinementKey }
    }
  }, [isSearching, currentPage, refinementKey])

  const isPagingOnly =
    refinementKey === settled.current.refinementKey &&
    currentPage !== settled.current.page

  const showSkeleton = hasNoResultsYet || (isSearching && isPagingOnly)

  if (status === "error") {
    return (
      <Text
        className="py-16 text-center text-ui-fg-error"
        data-testid="products-error"
      >
        Ürünler yüklenemedi
        {error?.message ? `: ${error.message}` : "."}
      </Text>
    )
  }

  return (
    <>
      {showSkeleton ? (
        <SkeletonProductGrid numberOfProducts={hitsPerPage} />
      ) : !items.length ? (
        <Text
          className="py-16 text-center text-ui-fg-subtle"
          data-testid="no-products"
        >
          Bu filtrelere uygun ürün bulunamadı.
        </Text>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-3 small:gap-5"
          data-testid="products-list"
        >
          {items.map((hit) =>
            hit.handle ? (
              <li key={hit.objectID} className="group relative">
                <LocalizedClientLink
                  href={`/products/${hit.handle}`}
                  className="block h-full"
                >
                  <div
                    data-testid="product-wrapper"
                    className="relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition-all duration-200 group-hover:border-brand group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
                  >
                    {qualifiesForFreeShipping(
                      hit[priceAttribute("min_price", currencyCode)] as number
                    ) && (
                      <FreeShippingBadge
                        size="sm"
                        className="absolute right-3 top-3 z-10"
                      />
                    )}
                    {outOfStock.has(hit.handle) && (
                      <span className="absolute left-3 top-3 z-10">
                        <OutOfStockBadge />
                      </span>
                    )}
                    <Thumbnail
                      thumbnail={hit.thumbnail}
                      size="square"
                      className="!rounded-none !shadow-none !bg-soft"
                    />
                    <div className="flex flex-1 flex-col gap-2 border-t border-line p-4">
                      <h3
                        className="line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-navy"
                        data-testid="product-title"
                      >
                        {hit.title}
                      </h3>
                      <div className="mt-auto flex flex-col">
                        <HitPrice hit={hit} currencyCode={currencyCode} />
                        <span className="text-[11px] text-muted">KDV Dahil</span>
                      </div>
                      <span
                        className={`mt-2 flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-brand text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand-dark ${
                          outOfStock.has(hit.handle)
                            ? OUT_OF_STOCK_BUTTON_GAP
                            : ""
                        }`}
                      >
                        <CardButtonLabel outOfStock={outOfStock.has(hit.handle)} />
                      </span>
                    </div>
                  </div>
                </LocalizedClientLink>
                {/* beside the card link, not inside it (no nested links) */}
                {outOfStock.has(hit.handle) && (
                  <OutOfStockWhatsApp title={hit.title ?? ""} />
                )}
              </li>
            ) : null
          )}
        </ul>
      )}
      <SearchPagination />
    </>
  )
}

export default StoreHits
