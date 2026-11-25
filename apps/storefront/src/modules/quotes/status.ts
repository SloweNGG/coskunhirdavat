import { QuoteStatus } from "@lib/data/quotes"

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; className: string }> = {
  pending_merchant: { label: "Bekliyor", className: "bg-amber-50 text-amber-800" },
  pending_customer: { label: "Teklif verildi", className: "bg-soft text-brand-ink" },
  accepted: { label: "Kabul edildi", className: "bg-green-50 text-green-800" },
  customer_rejected: { label: "Reddedildi", className: "bg-red-50 text-red-800" },
  merchant_rejected: { label: "Reddedildi", className: "bg-red-50 text-red-800" },
}
