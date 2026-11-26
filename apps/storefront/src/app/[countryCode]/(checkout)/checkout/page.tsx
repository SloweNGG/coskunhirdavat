import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Ödeme",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    // Screen split in half: the form hugs the middle from the left, the grey
    // cart panel hugs it from the right (both capped at 600px).
    <div className="grid grid-cols-1 small:min-h-[calc(100vh-5rem)] small:grid-cols-2">
      <div className="px-6 py-10 small:flex small:justify-end small:py-7 small:pl-10 small:pr-14">
        <div className="w-full small:max-w-[600px]">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>
      </div>
      <div className="border-t border-line bg-soft px-6 py-10 small:border-l small:border-t-0 small:py-12 small:pl-14 small:pr-10">
        <div className="sticky top-8 w-full small:max-w-[600px]">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
