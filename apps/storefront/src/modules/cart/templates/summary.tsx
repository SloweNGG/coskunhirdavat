"use client"

import { LockClosedSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { CHECKOUT_CTA } from "@modules/checkout/components/cta-class"
import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

/** White summary card: totals, checkout and keep-shopping buttons. */
const Summary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-5 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-semibold text-navy">Sipariş özeti</h2>
      <CartTotals totals={cart} />
      <div className="flex flex-col gap-y-3">
        <LocalizedClientLink
          href={"/checkout?step=" + step}
          data-testid="checkout-button"
          className={`flex items-center justify-center gap-2 ${CHECKOUT_CTA} !text-white`}
        >
          <LockClosedSolid />
          Ödemeye geç
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/store"
          className="flex h-12 items-center justify-center rounded-xl border border-line text-[15px] font-semibold text-navy hover:border-navy/40"
        >
          Alışverişe devam et
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Summary
