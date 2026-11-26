export const DAY_MS = 24 * 60 * 60 * 1000

// Türkiye has stayed on UTC+3 all year since 2016, so a fixed offset is enough
// to group orders by the shop's calendar day.
const TR_OFFSET_MS = 3 * 60 * 60 * 1000

export const ALLOWED_DAYS = [7, 30, 90]

/** Start of the current day in Türkiye, as a UTC instant. */
export const startOfTodayTr = (now: Date) =>
  new Date(Math.floor((now.getTime() + TR_OFFSET_MS) / DAY_MS) * DAY_MS - TR_OFFSET_MS)

/** "YYYY-MM-DD" of the Türkiye calendar day the instant falls on. */
export const dayKey = (d: Date) =>
  new Date(d.getTime() + TR_OFFSET_MS).toISOString().slice(0, 10)

/** Amounts come back as BigNumber objects; they convert through valueOf. */
export const toNumber = (value: unknown) => Number(value ?? 0) || 0

/** Rounds sums to kuruş so float noise (0.1 + 0.2) never reaches the UI. */
export const round2 = (value: number) => Math.round(value * 100) / 100

export const BANK_TRANSFER_PROVIDER = "pp_system_default"

const PAYMENT_LABELS: Record<string, string> = {
  [BANK_TRANSFER_PROVIDER]: "Havale / EFT",
  pp_paytr_paytr: "Kredi kartı (PayTR)",
}

type PaymentCollectionRow = {
  status?: string | null
  payments?: ({ provider_id?: string | null } | null)[] | null
} | null

/** The provider the order was paid (or is to be paid) with. */
export const paymentMethodOf = (collections?: PaymentCollectionRow[] | null) => {
  const usable =
    collections?.find((c) => c && c.status !== "canceled" && c.payments?.length) ??
    collections?.find((c) => c?.payments?.length)
  const providerId = usable?.payments?.find(Boolean)?.provider_id ?? "none"
  return {
    provider_id: providerId,
    label:
      PAYMENT_LABELS[providerId] ?? (providerId === "none" ? "Ödeme kaydı yok" : providerId),
  }
}
