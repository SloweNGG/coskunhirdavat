"use client"
import { RadioGroup } from "@headlessui/react"
import { getPaymentInfo, isManual, isStripeLike } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripePaymentContainer,
} from "@modules/checkout/components/payment-container"
import { Button } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import StepCard, { StepInfo } from "@modules/checkout/components/step-card"
import { CHECKOUT_CTA } from "@modules/checkout/components/cta-class"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards &&
    ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])
      ?.length > 0 &&
    cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) ||
    paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputPaymentDetails =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputPaymentDetails) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const activeInfo = getPaymentInfo(activeSession?.provider_id)

  return (
    <StepCard
      step={3}
      title="Ödeme"
      state={isOpen ? "active" : paymentReady ? "done" : "upcoming"}
      onEdit={!isOpen && paymentReady ? handleEdit : undefined}
      editTestId="edit-payment-button"
    >
      <div className={isOpen ? "block" : "hidden"}>
        {!paidByGiftcard && availablePaymentMethods?.length && (
          <RadioGroup
            value={selectedPaymentMethod}
            onChange={(value: string) => setPaymentMethod(value)}
          >
            {availablePaymentMethods.map((paymentMethod) => (
              <div key={paymentMethod.id}>
                {isStripeLike(paymentMethod.id) ? (
                  <StripePaymentContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                    setError={setError}
                    setPaymentComplete={setPaymentComplete}
                  />
                ) : (
                  <PaymentContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                  />
                )}
              </div>
            ))}
          </RadioGroup>
        )}

        {paidByGiftcard && (
          <StepInfo label="Ödeme yöntemi" data-testid="payment-method-summary">
            Hediye kartı
          </StepInfo>
        )}

        <ErrorMessage
          error={error}
          data-testid="payment-method-error-message"
        />

        <Button
          size="large"
          className={`mt-6 ${CHECKOUT_CTA}`}
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={
            (isStripeLike(selectedPaymentMethod) && !paymentComplete) ||
            (!selectedPaymentMethod && !paidByGiftcard)
          }
          data-testid="submit-payment-button"
        >
          {!activeSession && isStripeLike(selectedPaymentMethod)
            ? "Ödeme bilgilerini gir"
            : "Onaya devam et"}
        </Button>
      </div>

      {!isOpen &&
        (cart && paymentReady && activeSession ? (
          <StepInfo label="Ödeme yöntemi">
            <div className="flex items-center gap-x-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-ink ring-1 ring-inset ring-brand-100"
                aria-hidden
              >
                {activeInfo?.icon || <CreditCard />}
              </span>
              <div className="flex min-w-0 flex-col leading-5">
                <span
                  className="font-semibold"
                  data-testid="payment-method-summary"
                >
                  {activeInfo?.title || activeSession?.provider_id}
                </span>
                <span
                  className="text-muted"
                  data-testid="payment-details-summary"
                >
                  {isManual(activeSession?.provider_id)
                    ? "Hesap bilgileri sipariş onayında da gösterilir"
                    : "Ödemeyi son adımda tamamlayacaksınız"}
                </span>
              </div>
            </div>
          </StepInfo>
        ) : paidByGiftcard ? (
          <StepInfo label="Ödeme yöntemi" data-testid="payment-method-summary">
            Hediye kartı
          </StepInfo>
        ) : null)}
    </StepCard>
  )
}

export default Payment
