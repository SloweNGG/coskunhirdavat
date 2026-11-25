"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag, getCartId, removeCartId } from "./cookies"

export type QuoteStatus =
  | "pending_merchant"
  | "pending_customer"
  | "accepted"
  | "customer_rejected"
  | "merchant_rejected"

export type StoreQuote = {
  id: string
  status: QuoteStatus
  created_at: string
  draft_order: {
    id: string
    display_id: number
    currency_code: string
    total: number
    items: {
      id: string
      title: string
      thumbnail: string | null
      variant_title: string | null
      product_handle: string | null
      quantity: number
      unit_price: number
      total: number
    }[]
  }
  // Order with the store's offered prices/quantities applied.
  preview?: {
    total: number
    subtotal: number
    tax_total: number
    items: { id: string; quantity: number; unit_price: number; total: number }[]
  }
}

// Quotes change on the merchant side, so they are never cached.
const fetchQuotes = async <T>(path: string, method: "GET" | "POST" = "GET", body?: object) =>
  sdk.client.fetch<T>(`/store/customers/me/quotes${path}`, {
    method,
    body,
    headers: await getAuthHeaders(),
    cache: "no-store",
  })

export const listQuotes = async () =>
  fetchQuotes<{ quotes: StoreQuote[] }>("")
    .then(({ quotes }) => quotes)
    .catch(medusaError)

export const retrieveQuote = async (id: string) =>
  fetchQuotes<{ quote: StoreQuote }>(`/${id}`)
    .then(({ quote }) => quote)
    .catch(() => null)

/** Turns the current cart into a quote request; the cart is then retired. */
export const requestQuote = async (): Promise<{ id?: string; error?: string }> => {
  const cartId = await getCartId()
  if (!cartId) {
    return { error: "Sepet bulunamadı." }
  }
  try {
    const { quote } = await fetchQuotes<{ quote: StoreQuote }>("", "POST", {
      cart_id: cartId,
    })
    await removeCartId()
    revalidateTag(await getCacheTag("carts"), { expire: 0 })
    return { id: quote.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export const respondToQuote = async (
  id: string,
  action: "accept" | "reject"
): Promise<{ error?: string }> => {
  try {
    await fetchQuotes(`/${id}/${action}`, "POST")
    if (action === "accept") {
      revalidateTag(await getCacheTag("orders"), { expire: 0 })
    }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
