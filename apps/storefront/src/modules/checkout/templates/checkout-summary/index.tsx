import { HttpTypes } from "@medusajs/types"
import { USP_ITEMS } from "@lib/store-config"
import { convertToLocale } from "@lib/util/money"
import DiscountCode from "@modules/checkout/components/discount-code"
import OrderNote from "@modules/checkout/components/order-note"
import CartTotals from "@modules/common/components/cart-totals"
import PriceText from "@modules/common/components/price-text"
import StoreIcon from "@modules/common/components/store-icon"
import Thumbnail from "@modules/products/components/thumbnail"

// Store promises repeated under the summary, texts from store-config.
const TRUST_ITEMS = USP_ITEMS.filter((item) =>
  ["truck", "lock", "refresh"].includes(item.icon)
)

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const items = [...(cart.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )
  const money = (amount?: number | null) =>
    convertToLocale({ amount: amount ?? 0, currency_code: cart.currency_code })

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-6 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Sipariş özeti</h2>
          <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium text-navy/70">
            {items.reduce((n, i) => n + i.quantity, 0)} ürün
          </span>
        </div>
        <ul className="flex flex-col gap-y-5" data-testid="items-table">
          {items.map((item) => {
            const discounted =
              (item.original_total ?? 0) > (item.total ?? 0) + 0.001
            return (
              <li
                key={item.id}
                className="flex items-center gap-x-4"
                data-testid="product-row"
              >
                <div className="relative w-16 shrink-0">
                  <Thumbnail
                    thumbnail={item.thumbnail}
                    images={item.variant?.product?.images}
                    size="square"
                    className="!rounded-lg border border-line !bg-white !shadow-none"
                  />
                  <span
                    className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-navy px-1.5 text-xs font-semibold text-white"
                    data-testid="product-quantity"
                  >
                    {item.quantity}
                    <span className="sr-only"> adet</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold text-navy"
                    data-testid="product-title"
                  >
                    {item.product_title}
                  </p>
                  {item.variant?.title &&
                    item.variant.title !== "Default Variant" && (
                      <p className="text-xs text-muted">{item.variant.title}</p>
                    )}
                </div>
                <div className="text-right text-sm">
                  {discounted && (
                    <p className="text-xs text-muted line-through">
                      <PriceText value={money(item.original_total)} />
                    </p>
                  )}
                  <p className="font-bold text-navy">
                    <PriceText value={money(item.total)} />
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-navy/10 pt-6">
          <CartTotals totals={cart} />
        </div>

        {/* CartTotals already ends with a divider */}
        <div className="-mt-2 flex flex-col gap-y-1">
          <DiscountCode cart={cart} />
          <OrderNote
            initialNote={cart.metadata?.order_note as string | undefined}
          />
        </div>
      </div>

      <ul
        className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line"
        aria-label="Alışveriş güvencesi"
      >
        {TRUST_ITEMS.map((item) => (
          <li
            key={item.title}
            className="flex flex-col items-center gap-y-2 bg-white px-2 py-4 text-center"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-ink ring-1 ring-inset ring-brand-100">
              <StoreIcon name={item.icon} className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col gap-y-0.5">
              <span className="text-[13px] font-semibold leading-tight text-navy">
                {item.title}
              </span>
              <span className="text-xs leading-snug text-muted">
                {item.text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CheckoutSummary
