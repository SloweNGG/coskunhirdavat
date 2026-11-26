import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import PriceText from "@modules/common/components/price-text"
import FreeShippingBadge, {
  qualifiesForFreeShipping,
} from "@modules/common/components/free-shipping-badge"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-40 h-10 bg-soft animate-pulse rounded" />
  }

  const isSale = selectedPrice.price_type === "sale"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[42px] font-bold leading-none text-navy">
          {!variant && (
            <span className="mr-1 text-sm font-medium text-muted">
              Başlangıç fiyatı
            </span>
          )}
          <span
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
            className={isSale ? "text-sale" : undefined}
          >
            <PriceText value={selectedPrice.calculated_price} />
          </span>
        </span>
        {isSale && (
          <>
            <span
              className="text-xl font-semibold text-muted line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              <PriceText value={selectedPrice.original_price} />
            </span>
            <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-bold text-white">
              %{selectedPrice.percentage_diff} İNDİRİM
            </span>
          </>
        )}
      </div>
      <span className="text-xs text-muted">Fiyatlara KDV dahildir.</span>
      {qualifiesForFreeShipping(selectedPrice.calculated_price_number) && (
        <FreeShippingBadge className="mt-2 w-fit" />
      )}
    </div>
  )
}
