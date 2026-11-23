"use client"

import { subscribeToRestock } from "@lib/data/restock"
import { CheckCircleSolid } from "@medusajs/icons"
import { FormEvent, useState } from "react"

/** "Gelince haber ver": shown instead of add-to-cart while the variant is out of stock. */
export default function RestockForm({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("sending")
    setError(null)
    const result = await subscribeToRestock(variantId, email.trim())
    if (result.success) {
      setStatus("done")
    } else {
      setError(result.error)
      setStatus("idle")
    }
  }

  if (status === "done") {
    return (
      <p
        className="flex items-center gap-2 rounded-2xl bg-soft p-4 text-sm font-medium text-emerald-700"
        role="status"
        data-testid="restock-success"
      >
        <CheckCircleSolid />
        Teşekkürler! Ürün stoğa girdiğinde size e-posta göndereceğiz.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-line p-4"
      data-testid="restock-form"
    >
      <div>
        <p className="text-sm font-semibold text-navy">Gelince haber ver</p>
        <p className="text-xs text-muted">
          Bu ürün stoğa girdiğinde size e-posta ile haber verelim.
        </p>
      </div>
      <div className="flex gap-2">
        <label htmlFor="restock-email" className="sr-only">
          E-posta adresiniz
        </label>
        <input
          id="restock-email"
          type="email"
          required
          autoComplete="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-xl bg-soft px-4 text-sm text-navy outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-12 shrink-0 rounded-xl bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy/90 disabled:opacity-40"
        >
          {status === "sending" ? "Gönderiliyor..." : "Haber ver"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-sale" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
