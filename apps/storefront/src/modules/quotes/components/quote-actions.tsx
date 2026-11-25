"use client"

import { respondToQuote } from "@lib/data/quotes"
import { CHECKOUT_CTA } from "@modules/checkout/components/cta-class"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

/** "Kabul et" / "Reddet" for a quote the store has priced. */
const QuoteActions = ({ id }: { id: string }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const respond = (action: "accept" | "reject") =>
    startTransition(async () => {
      if (action === "reject" && !window.confirm("Teklifi reddetmek istediğinize emin misiniz?")) {
        return
      }
      setError(null)
      const res = await respondToQuote(id, action)
      if (res.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 small:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond("accept")}
          className={CHECKOUT_CTA}
        >
          Kabul et
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => respond("reject")}
          className="h-12 w-full rounded-xl border border-line text-[15px] font-semibold text-navy hover:border-navy/40 disabled:opacity-50"
        >
          Reddet
        </button>
      </div>
      {error && (
        <p className="text-sm text-sale" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default QuoteActions
