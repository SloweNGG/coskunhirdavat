"use client"

import { ExclamationCircle, Heart } from "@medusajs/icons"
import { updateLineItem } from "@lib/data/cart"
import { FAVORITES_KEY, useStoredIds } from "@lib/hooks/use-stored-ids"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PriceText from "@modules/common/components/price-text"
import { clx } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import QuantityInput from "@modules/products/components/product-actions/quantity-input"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

// shown when tracked stock drops to this many units or fewer
const LOW_STOCK = 3

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}

/** Cart line as a card: picture, details, delivery notes, quantity, save/remove. */
const Item = ({ item, currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { ids, toggle } = useStoredIds(FAVORITES_KEY)
  const saved = !!item.product_id && ids.includes(item.product_id)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const variant = item.variant
  const stock =
    variant?.manage_inventory &&
    !variant.allow_backorder &&
    typeof variant.inventory_quantity === "number"
      ? variant.inventory_quantity
      : undefined
  const maxQuantity = stock !== undefined ? Math.max(item.quantity, stock) : 999
  const money = (amount?: number | null) =>
    convertToLocale({ amount: amount ?? 0, currency_code: currencyCode })
  const variantTitle =
    variant?.title && variant.title !== "Default Variant" ? variant.title : null

  return (
    <li
      className="flex gap-4 rounded-2xl border border-line bg-white p-4 small:gap-5 small:p-5"
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="w-24 shrink-0 small:w-28"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
          className="!rounded-xl !bg-soft !shadow-none"
        />
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-1 flex-col gap-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <LocalizedClientLink
              href={`/products/${item.product_handle}`}
              className="line-clamp-2 text-[15px] font-semibold text-navy hover:underline"
              data-testid="product-title"
            >
              {item.product_title}
            </LocalizedClientLink>
            {variantTitle && (
              <p className="text-sm text-muted" data-testid="product-variant">
                {variantTitle}
              </p>
            )}
          </div>
          {item.product_id && (
            <button
              type="button"
              onClick={() => toggle(item.product_id!)}
              aria-pressed={saved}
              className={clx(
                "flex shrink-0 items-center gap-1 text-sm",
                saved ? "text-sale" : "text-navy/60 hover:text-navy"
              )}
            >
              {saved ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
                </svg>
              ) : (
                <Heart />
              )}
              <span className="hidden xsmall:inline">
                {saved ? "Kaydedildi" : "Kaydet"}
              </span>
            </button>
          )}
        </div>

        {stock !== undefined && stock <= LOW_STOCK && (
          <p className="flex items-center gap-1.5 rounded-lg bg-sale/10 px-2.5 py-1.5 text-xs font-medium text-sale">
            <ExclamationCircle />
            {stock > 0 ? `Stokta son ${stock} adet` : "Stokta kalmadı"}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <QuantityInput
              size="sm"
              value={item.quantity}
              onChange={(q) => q !== item.quantity && changeQuantity(q)}
              max={maxQuantity}
              disabled={updating}
            />
            <DeleteButton id={item.id} />
            {updating && <Spinner />}
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span
              className="text-lg font-bold text-navy"
              data-testid="product-price"
            >
              <PriceText value={money(item.total)} />
            </span>
            {item.quantity > 1 && (
              <span className="text-xs text-muted">
                <PriceText value={money(item.unit_price)} /> / adet
              </span>
            )}
          </div>
        </div>
        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </li>
  )
}

export default Item
