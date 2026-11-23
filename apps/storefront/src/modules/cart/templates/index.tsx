import { HttpTypes } from "@medusajs/types"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductSection from "@modules/home/components/product-section"
import EmptyCartMessage from "../components/empty-cart-message"
import FreeShippingBar from "../components/free-shipping-bar"
import SignInPrompt from "../components/sign-in-prompt"
import RequestQuoteButton from "@modules/quotes/components/request-quote-button"
import ItemsTemplate from "./items"
import Summary from "./summary"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  if (!cart?.items?.length) {
    return (
      <div className="content-container py-12" data-testid="cart-container">
        <EmptyCartMessage />
      </div>
    )
  }

  const itemCount = cart.items.reduce((n, i) => n + i.quantity, 0)

  return (
    // overflow-x-clip: confetti pieces fly past the screen edge on phones
    <div className="overflow-x-clip py-8 small:py-10">
      <div className="content-container" data-testid="cart-container">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-navy small:text-[28px]">
            Sepetim{" "}
            <span className="text-base font-medium text-muted">
              ({itemCount} ürün)
            </span>
          </h1>
          <LocalizedClientLink
            href="/store"
            className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
          >
            Alışverişe devam et
          </LocalizedClientLink>
        </div>

        <div className="grid grid-cols-1 gap-6 small:grid-cols-[1fr_380px] small:gap-8">
          <div className="flex flex-col gap-y-5">
            <div className="rounded-2xl border border-line bg-white px-5 py-4">
              <FreeShippingBar cart={cart} celebrate />
            </div>
            <ItemsTemplate cart={cart} />
            <div className="rounded-2xl border border-line bg-white p-4 small:p-5">
              <DiscountCode cart={cart} alwaysOpen />
            </div>
          </div>
          <div className="relative">
            <div className="sticky top-6 flex flex-col gap-y-4">
              {cart.region && <Summary cart={cart} />}
              <RequestQuoteButton loggedIn={!!customer} />
              {!customer && <SignInPrompt />}
            </div>
          </div>
        </div>
      </div>

      {cart.region && (
        <ProductSection
          eyebrow="Önerilenler"
          title="Bunlar da ilginizi çekebilir"
          region={cart.region}
          order="-created_at"
          limit={4}
        />
      )}
    </div>
  )
}

export default CartTemplate
