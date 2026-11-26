import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  ALLOWED_DAYS,
  DAY_MS,
  dayKey,
  paymentMethodOf,
  round2,
  startOfTodayTr,
  toNumber,
} from "../helpers"

type Totals = {
  revenue: number
  orders: number
  average: number
  new_customers: number
}

type OrderRow = {
  id: string
  created_at: string | Date
  total: unknown
  items?: ({
    product_id: string | null
    product_title: string | null
    title: string | null
    quantity: unknown
    total: unknown
  } | null)[] | null
  payment_collections?: Parameters<typeof paymentMethodOf>[0]
}

/**
 * GET /admin/dashboard/sales?days=7|30|90
 * Sales figures for the admin "Özet" page: totals for the period and the one
 * before it, daily buckets (Türkiye calendar days), best sellers and the split
 * by payment method. Only orders in the store's default currency count;
 * canceled and draft orders (open quotes) are left out.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const requested = Number(req.query.days)
  const days = ALLOWED_DAYS.includes(requested) ? requested : 30

  const now = new Date()
  const from = new Date(startOfTodayTr(now).getTime() - (days - 1) * DAY_MS)
  const prevFrom = new Date(from.getTime() - days * DAY_MS)

  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const currency =
    store?.supported_currencies?.find((c) => c?.is_default)?.currency_code ?? "try"

  const { data: orders } = (await query.graph({
    entity: "order",
    fields: [
      "id",
      "created_at",
      "total",
      "items.product_id",
      "items.product_title",
      "items.title",
      "items.quantity",
      "items.total",
      "payment_collections.status",
      "payment_collections.payments.provider_id",
    ],
    filters: {
      created_at: { $gte: prevFrom },
      currency_code: currency,
      is_draft_order: false,
      status: { $nin: ["canceled", "draft"] },
    },
  })) as unknown as { data: OrderRow[] }

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "created_at"],
    filters: { created_at: { $gte: prevFrom }, has_account: true },
  })

  const current: Totals = { revenue: 0, orders: 0, average: 0, new_customers: 0 }
  const previous: Totals = { revenue: 0, orders: 0, average: 0, new_customers: 0 }

  const daily = new Map<string, { date: string; revenue: number; orders: number }>()
  for (let i = 0; i < days; i++) {
    const key = dayKey(new Date(from.getTime() + i * DAY_MS))
    daily.set(key, { date: key, revenue: 0, orders: 0 })
  }

  const products = new Map<
    string,
    { product_id: string | null; title: string; quantity: number; revenue: number }
  >()
  const methods = new Map<
    string,
    { provider_id: string; label: string; revenue: number; orders: number }
  >()

  for (const order of orders) {
    const createdAt = new Date(order.created_at)
    const total = toNumber(order.total)
    const bucket = createdAt >= from ? current : previous
    bucket.revenue += total
    bucket.orders += 1
    if (bucket === previous) {
      continue
    }

    const day = daily.get(dayKey(createdAt))
    if (day) {
      day.revenue += total
      day.orders += 1
    }

    for (const item of order.items ?? []) {
      if (!item) {
        continue
      }
      const key = item.product_id ?? item.product_title ?? item.title ?? "?"
      const row = products.get(key) ?? {
        product_id: item.product_id,
        title: item.product_title ?? item.title ?? "Ürün",
        quantity: 0,
        revenue: 0,
      }
      row.quantity += toNumber(item.quantity)
      row.revenue += toNumber(item.total)
      products.set(key, row)
    }

    const method = paymentMethodOf(order.payment_collections)
    const row = methods.get(method.provider_id) ?? { ...method, revenue: 0, orders: 0 }
    row.revenue += total
    row.orders += 1
    methods.set(method.provider_id, row)
  }

  for (const customer of customers) {
    const bucket = new Date(customer.created_at) >= from ? current : previous
    bucket.new_customers += 1
  }
  for (const t of [current, previous]) {
    t.average = round2(t.orders ? t.revenue / t.orders : 0)
    t.revenue = round2(t.revenue)
  }

  res.json({
    days,
    from: from.toISOString(),
    to: now.toISOString(),
    currency_code: currency,
    current,
    previous,
    daily: [...daily.values()].map((d) => ({ ...d, revenue: round2(d.revenue) })),
    top_products: [...products.values()]
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ ...p, revenue: round2(p.revenue) })),
    payment_methods: [...methods.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .map((m) => ({ ...m, revenue: round2(m.revenue) })),
  })
}
