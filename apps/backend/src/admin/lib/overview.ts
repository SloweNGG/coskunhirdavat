export type Period = 7 | 30 | 90

export type SalesTotals = {
  revenue: number
  orders: number
  average: number
  new_customers: number
}

export type DailySales = { date: string; revenue: number; orders: number }

export type SalesSummary = {
  days: Period
  from: string
  to: string
  currency_code: string
  current: SalesTotals
  previous: SalesTotals
  daily: DailySales[]
  top_products: {
    product_id: string | null
    title: string
    quantity: number
    revenue: number
  }[]
  payment_methods: {
    provider_id: string
    label: string
    revenue: number
    orders: number
  }[]
}

export type PendingSummary = {
  bank_transfers: {
    count: number
    total: number
    items: {
      order_id: string
      display_id: number
      customer: string
      amount: number
      currency_code: string
      created_at: string
    }[]
  }
  quotes: { count: number }
  reviews: { count: number }
  low_stock: {
    threshold: number
    count: number
    sold_out: number
    items: {
      inventory_item_id: string
      product_id: string | null
      product_title: string
      variant_title: string | null
      sku: string | null
      available: number
    }[]
  }
}

export const fetchJson = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path, { credentials: "include" })
  if (!res.ok) {
    throw new Error((await res.json().catch(() => null))?.message || res.statusText)
  }
  return res.json()
}

const moneyFormatters = new Map<string, Intl.NumberFormat>()
const moneyFormat = (currency: string, options: Intl.NumberFormatOptions) => {
  const key = currency + JSON.stringify(options)
  let format = moneyFormatters.get(key)
  if (!format) {
    format = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency.toUpperCase(),
      ...options,
    })
    moneyFormatters.set(key, format)
  }
  return format
}

/** ₺1.749,90 */
export const formatMoney = (amount: number, currency = "try") =>
  moneyFormat(currency, {}).format(amount)

/** ₺55.397 — whole liras for headline figures. */
export const formatMoneyRounded = (amount: number, currency = "try") =>
  moneyFormat(currency, { maximumFractionDigits: 0 }).format(amount)

const compactLong = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  compactDisplay: "long",
  maximumFractionDigits: 1,
})
const currencySymbol = (currency: string) =>
  moneyFormat(currency, {})
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? ""

/**
 * Axis ticks: in full under 10.000 (₺2.500), spelled-out compact from there
 * on (₺20 bin, ₺1,5 milyon). Currency compact gives "₺20 B", which reads badly.
 */
export const formatAxisMoney = (amount: number, compact: boolean, currency = "try") =>
  compact
    ? `${currencySymbol(currency)}${compactLong.format(amount)}`
    : moneyFormat(currency, { maximumFractionDigits: 0 }).format(amount)

export const formatNumber = (n: number) => new Intl.NumberFormat("tr-TR").format(n)

const percentFormat = new Intl.NumberFormat("tr-TR", {
  style: "percent",
  maximumFractionDigits: 0,
})
/** %12 */
export const formatPercent = (ratio: number) => percentFormat.format(ratio)

// Day keys are "YYYY-MM-DD" in Türkiye time; reading them at UTC noon keeps
// the calendar day intact whatever the browser's time zone is.
const dayDate = (key: string) => new Date(`${key}T12:00:00Z`)
const shortDay = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})
const longDay = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})
/** 20 Kas */
export const formatShortDay = (key: string) => shortDay.format(dayDate(key))
/** 20 Kasım Cuma */
export const formatLongDay = (key: string) => longDay.format(dayDate(key))

const relative = new Intl.RelativeTimeFormat("tr", { numeric: "auto" })
/** "bugün", "dün", "5 gün önce" */
export const formatDaysAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return relative.format(-days, "day")
}

/**
 * Chart colours, validated for colour-blind separation and contrast against
 * the admin's light (#ffffff) and dark (#212124) card backgrounds. Slot 1 is
 * the shop's turquoise. Colour follows the payment method, never its rank.
 */
export const CHART_STYLE = `
.overview-viz {
  --series-1: #1098ad;
  --series-2: #e8590c;
  --series-other: #a1a1aa;
}
.dark .overview-viz {
  --series-1: #15aabf;
  --series-2: #e76624;
  --series-other: #71717a;
}
`

export const PAYMENT_COLORS: Record<string, string> = {
  pp_system_default: "var(--series-1)",
  pp_paytr_paytr: "var(--series-2)",
}
export const paymentColor = (providerId: string) =>
  PAYMENT_COLORS[providerId] ?? "var(--series-other)"
