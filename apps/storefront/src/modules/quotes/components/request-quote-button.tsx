"use client"

import { requestQuote } from "@lib/data/quotes"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, useRouter } from "next/navigation"
import { useState, useTransition } from "react"

const SECONDARY =
  "flex h-12 w-full items-center justify-center rounded-xl border border-line text-[15px] font-semibold text-navy hover:border-navy/40 disabled:opacity-50"

/** Cart page: turns the cart into a bulk-purchase quote request. */
const RequestQuoteButton = ({ loggedIn }: { loggedIn: boolean }) => {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode: string }
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-line bg-white p-4">
        <LocalizedClientLink href="/account" className={SECONDARY}>
          Toplu alım için teklif iste
        </LocalizedClientLink>
        <p className="mt-2 text-center text-xs text-muted">
          Teklif istemek için önce giriş yapmanız gerekir.
        </p>
      </div>
    )
  }

  const submit = () =>
    startTransition(async () => {
      setError(null)
      const res = await requestQuote()
      if (res.error || !res.id) {
        setError(res.error || "Teklif talebi gönderilemedi.")
        return
      }
      router.push(`/${countryCode}/account/quotes/${res.id}`)
    })

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <button type="button" onClick={submit} disabled={pending} className={SECONDARY}>
        {pending ? "Gönderiliyor..." : "Toplu alım için teklif iste"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Sepetiniz teklif talebine dönüşür; fiyatı inceleyip size dönüş yaparız.
      </p>
      {error && (
        <p className="mt-2 text-center text-sm text-sale" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default RequestQuoteButton
