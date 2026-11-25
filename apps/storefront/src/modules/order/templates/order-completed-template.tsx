import { Heading } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import { isManual } from "@lib/constants"
import BankTransferInfo from "@modules/checkout/components/bank-transfer-info"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const paidByBankTransfer = !!order.payment_collections?.some((pc) =>
    pc.payments?.some((p) => isManual(p.provider_id))
  )

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Teşekkür ederiz!</span>
            <span>Siparişiniz başarıyla oluşturuldu.</span>
          </Heading>
          <OrderDetails order={order} />
          {paidByBankTransfer && (
            <div className="flex flex-col gap-y-3">
              <Heading level="h2" className="text-2xl font-semibold text-navy">
                Havale / EFT bilgileri
              </Heading>
              <BankTransferInfo orderNumber={order.display_id} />
            </div>
          )}
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Özet
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
