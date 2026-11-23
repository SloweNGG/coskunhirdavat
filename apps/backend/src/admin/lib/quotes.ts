export type QuoteStatus =
  | "pending_merchant"
  | "pending_customer"
  | "accepted"
  | "customer_rejected"
  | "merchant_rejected"

export type QuoteItem = {
  id: string
  title: string
  subtitle: string | null
  thumbnail: string | null
  variant_title: string | null
  variant_sku: string | null
  quantity: number
  unit_price: number
  total: number
}

export type Quote = {
  id: string
  status: QuoteStatus
  created_at: string
  customer: {
    email: string
    first_name: string | null
    last_name: string | null
    company_name: string | null
    phone: string | null
  } | null
  draft_order: {
    id: string
    display_id: number
    status: string
    currency_code: string
    total: number
    items: QuoteItem[]
  } | null
  preview?: {
    total: number
    subtotal: number
    tax_total: number
    items: { id: string; quantity: number; unit_price: number; total: number }[]
  }
}

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  pending_merchant: "Yanıt bekliyor",
  pending_customer: "Teklif gönderildi",
  accepted: "Kabul edildi",
  customer_rejected: "Müşteri reddetti",
  merchant_rejected: "Reddedildi",
}

export const STATUS_COLOR: Record<QuoteStatus, "orange" | "blue" | "green" | "red"> = {
  pending_merchant: "orange",
  pending_customer: "blue",
  accepted: "green",
  customer_rejected: "red",
  merchant_rejected: "red",
}

export const formatMoney = (amount: number, currency = "try") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)

export const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    throw new Error((await res.json().catch(() => null))?.message || res.statusText)
  }
  return res.json()
}
