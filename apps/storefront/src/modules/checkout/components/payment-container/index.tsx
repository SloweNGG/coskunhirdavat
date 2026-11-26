import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@modules/common/components/ui"
import { optionClass } from "@modules/checkout/components/cta-class"
import React, { useContext } from "react"

import Radio from "@modules/common/components/radio"

import { getPaymentInfo, isManual } from "@lib/constants"
import { getPaymentErrorMessage } from "@lib/util/payment-error"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { PaymentElement } from "@stripe/react-stripe-js"
import BankTransferInfo from "../bank-transfer-info"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  disabled = false,
  children,
}) => {
  const paymentInfo = getPaymentInfo(paymentProviderId)
  const selected = selectedPaymentOptionId === paymentProviderId

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        optionClass(selected, disabled),
        "flex-col !items-stretch"
      )}
    >
      <div className="flex items-center justify-between gap-x-4">
        <div className="flex min-w-0 items-center gap-x-3">
          <Radio checked={selected} />
          <div className="flex min-w-0 flex-col">
            <span className="text-[15px] font-semibold text-navy">
              {paymentInfo?.title || paymentProviderId}
            </span>
            {paymentInfo?.description && (
              <span className="text-xs text-muted">
                {paymentInfo.description}
              </span>
            )}
          </div>
        </div>
        <span
          className={clx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            selected ? "bg-white text-brand-ink" : "bg-soft text-navy/60"
          )}
          aria-hidden
        >
          {paymentInfo?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) &&
        selectedPaymentOptionId === paymentProviderId && (
          <div className="mt-4">
            <BankTransferInfo />
          </div>
        )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripePaymentContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  disabled = false,
  setError,
  setPaymentComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setError: (error: string | null) => void
  setPaymentComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Ödeme bilgilerinizi girin:
            </Text>
            <PaymentElement
              options={{ layout: "accordion" }}
              onChange={(e) => {
                setError(null)
                setPaymentComplete(e.complete)
              }}
              // Without a handler Stripe.js reports a failed mount as an
              // unhandled "payment Element loaderror" and the option renders
              // blank with no explanation. Surface it in the checkout's own
              // error slot instead.
              onLoadError={(e) => {
                setPaymentComplete(false)
                setError(
                  getPaymentErrorMessage(e.error) ??
                    "Ödeme yöntemleri yüklenemedi."
                )
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
