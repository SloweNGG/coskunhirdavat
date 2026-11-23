import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import CheckoutStepper from "@modules/checkout/components/checkout-stepper"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    // step bodies are indented under the numbered title, like the reference
    <div className="w-full grid grid-cols-1 gap-y-8 small:[&>div>*:not(:first-child)]:pl-11">
      <section className="flex flex-col gap-y-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-navy">
            Siparişinizi tamamlayın
          </h1>
          <p className="mt-1 text-sm text-muted">
            Bilgilerinizi kontrol edin, siparişinizi güvenle ve hızlıca verin.
          </p>
        </div>
        <CheckoutStepper />
      </section>

      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      <Review cart={cart} />
    </div>
  )
}
