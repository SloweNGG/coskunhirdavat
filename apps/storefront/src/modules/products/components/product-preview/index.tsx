import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FreeShippingBadge, {
  qualifiesForFreeShipping,
} from "@modules/common/components/free-shipping-badge"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default function ProductPreview({
  product,
  isFeatured: _isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region?: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const isSale = cheapestPrice?.price_type === "sale"
  const categoryName = product.categories?.[0]?.name ?? product.collection?.title
  const sku = product.variants?.find((v) => v.sku)?.sku

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block h-full"
    >
      <div
        data-testid="product-wrapper"
        className="relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition-all duration-200 group-hover:border-brand group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
      >
        {isSale && cheapestPrice?.percentage_diff && (
          <span className="absolute left-3 top-3 z-10 rounded bg-sale px-2 py-1 text-xs font-bold text-white">
            %{cheapestPrice.percentage_diff} İndirim
          </span>
        )}
        {qualifiesForFreeShipping(cheapestPrice?.calculated_price_number) && (
          <FreeShippingBadge size="sm" className="absolute right-3 top-3 z-10" />
        )}
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          alt={product.title}
          size="square"
          className="!rounded-none !shadow-none !bg-soft"
        />
        <div className="flex flex-1 flex-col gap-2 border-t border-line p-4">
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-medium uppercase tracking-wider">
            {categoryName && <span className="truncate text-brand-ink">{categoryName}</span>}
            {sku && <span className="shrink-0 text-navy/40">#{sku}</span>}
          </div>
          <h3
            className="line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-navy"
            data-testid="product-title"
          >
            {product.title}
          </h3>
          <div className="mt-auto flex flex-col">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            <span className="text-[11px] text-muted">KDV Dahil</span>
          </div>
          <span className="mt-2 flex h-10 items-center justify-center rounded-md bg-brand text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand-dark">
            Ürünü İncele
          </span>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
