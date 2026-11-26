"use client"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import StepCard from "@modules/checkout/components/step-card"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"
  const [consent, setConsent] = useState(false)

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards &&
    ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])
      ?.length > 0 &&
    cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <StepCard step={4} title="Onay" state={isOpen ? "active" : "upcoming"}>
      {isOpen && previousStepsCompleted && (
        <>
          <label className="mb-5 flex cursor-pointer items-start gap-x-3 rounded-xl bg-soft p-4 text-sm leading-6 text-navy">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-[3px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-brand"
              data-testid="contract-consent-checkbox"
            />
            <span>
              <LocalizedClientLink
                href="/terms"
                target="_blank"
                className="font-semibold text-brand-ink underline underline-offset-2 hover:text-navy"
              >
                Ön Bilgilendirme Formu
              </LocalizedClientLink>
              &apos;nu ve{" "}
              <LocalizedClientLink
                href="/terms"
                target="_blank"
                className="font-semibold text-brand-ink underline underline-offset-2 hover:text-navy"
              >
                Mesafeli Satış Sözleşmesi
              </LocalizedClientLink>
              &apos;ni okudum, kabul ediyorum.
            </span>
          </label>
          <PaymentButton
            cart={cart}
            disabled={!consent}
            data-testid="submit-order-button"
          />
          <p className="mt-3 text-center text-xs text-muted">
            Sorun mu yaşıyorsunuz?{" "}
            <a
              href={STORE_INFO.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-whatsapp-ink underline underline-offset-2"
            >
              Bize WhatsApp&apos;tan yazın
            </a>
          </p>
        </>
      )}
    </StepCard>
  )
}

export default Review
