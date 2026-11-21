"use client"

import { getPaytrIframe } from "@lib/data/paytr"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect, useState } from "react"
import ErrorMessage from "../error-message"

type PaytrPaymentButtonProps = {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void
  }
}

const FAILED_MESSAGE =
  "Ödemeniz tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz."

/**
 * Shows PayTR's hosted payment form in an iFrame. Card data never touches
 * our servers; PayTR notifies the backend and returns the shopper to
 * /api/paytr-return, which places the order.
 */
const PaytrPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: PaytrPaymentButtonProps) => {
  const searchParams = useSearchParams()
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get("paytr") === "failed" ? FAILED_MESSAGE : null
  )

  useEffect(() => {
    if (iframeUrl && window.iFrameResize) {
      window.iFrameResize({}, "#paytriframe")
    }
  }, [iframeUrl])

  const openPaymentForm = async () => {
    setLoading(true)
    setErrorMessage(null)

    const result = await getPaytrIframe(cart.id)

    if ("error" in result) {
      setErrorMessage(result.error)
    } else {
      setIframeUrl(result.iframeUrl)
    }

    setLoading(false)
  }

  return (
    <>
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (iframeUrl) {
            window.iFrameResize?.({}, "#paytriframe")
          }
        }}
      />
      {iframeUrl ? (
        <div className="w-full" data-testid="paytr-iframe-container">
          <iframe
            id="paytriframe"
            src={iframeUrl}
            title="PayTR güvenli ödeme"
            className="w-full border-0"
            style={{ minHeight: 640 }}
            allow="payment"
          />
          <button
            type="button"
            className="mt-2 text-small-regular text-ui-fg-subtle underline"
            onClick={() => setIframeUrl(null)}
          >
            Ödeme formunu kapat
          </button>
        </div>
      ) : (
        <Button
          disabled={notReady}
          isLoading={loading}
          onClick={openPaymentForm}
          size="large"
          data-testid={dataTestId}
        >
          Kartla öde
        </Button>
      )}
      <ErrorMessage error={errorMessage} data-testid="paytr-payment-error-message" />
    </>
  )
}

export default PaytrPaymentButton
