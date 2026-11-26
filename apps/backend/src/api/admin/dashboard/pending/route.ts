import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BANK_TRANSFER_PROVIDER, round2, toNumber } from "../helpers"

// An item counts as running low at or below this many available units.
const LOW_STOCK_THRESHOLD = 5
// The page shows the first five and can expand to this many.
const LIST_LIMIT = 50

type CollectionRow = {
  id: string
  amount: unknown
  currency_code: string
  payments?: ({ provider_id?: string | null } | null)[] | null
  order?: {
    id: string
    display_id: number
    email: string | null
    status: string
    is_draft_order: boolean
    created_at: string | Date
    shipping_address?: { first_name?: string | null; last_name?: string | null; company?: string | null } | null
  } | null
}

type InventoryRow = {
  id: string
  sku: string | null
  title: string | null
  location_levels?: ({ stocked_quantity: unknown; reserved_quantity: unknown } | null)[] | null
  variants?: ({
    id: string
    title: string | null
    product?: { id: string; title: string; status: string } | null
  } | null)[] | null
}

/**
 * GET /admin/dashboard/pending
 * Things waiting for the shop owner, independent of any date range:
 * bank transfers not marked as received, quotes waiting for an answer,
 * reviews waiting for moderation and items running out of stock.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Havale / EFT orders stay "authorized" until the owner captures the payment.
  const { data: collections } = (await query.graph({
    entity: "payment_collection",
    fields: [
      "id",
      "amount",
      "currency_code",
      "payments.provider_id",
      "order.id",
      "order.display_id",
      "order.email",
      "order.status",
      "order.is_draft_order",
      "order.created_at",
      "order.shipping_address.first_name",
      "order.shipping_address.last_name",
      "order.shipping_address.company",
    ],
    filters: { status: ["authorized", "partially_authorized"] },
  })) as unknown as { data: CollectionRow[] }

  const bankTransfers = collections
    .filter(
      (c) =>
        c.order &&
        !c.order.is_draft_order &&
        c.order.status !== "canceled" &&
        c.payments?.some((p) => p?.provider_id === BANK_TRANSFER_PROVIDER)
    )
    .map((c) => {
      const order = c.order!
      const address = order.shipping_address
      const name = [address?.first_name, address?.last_name].filter(Boolean).join(" ")
      return {
        order_id: order.id,
        display_id: order.display_id,
        customer: address?.company || name || order.email || "-",
        amount: toNumber(c.amount),
        currency_code: c.currency_code,
        created_at: new Date(order.created_at).toISOString(),
      }
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const { data: items } = (await query.graph({
    entity: "inventory_item",
    fields: [
      "id",
      "sku",
      "title",
      "location_levels.stocked_quantity",
      "location_levels.reserved_quantity",
      "variants.id",
      "variants.title",
      "variants.product.id",
      "variants.product.title",
      "variants.product.status",
    ],
  })) as unknown as { data: InventoryRow[] }

  const lowStock = items
    .map((item) => {
      // Only published products can be bought, so only they can run out.
      const variant = item.variants?.find((v) => v?.product?.status === "published")
      const available = (item.location_levels ?? []).reduce(
        (sum, l) => sum + toNumber(l?.stocked_quantity) - toNumber(l?.reserved_quantity),
        0
      )
      return {
        inventory_item_id: item.id,
        product_id: variant?.product?.id ?? null,
        product_title: variant?.product?.title ?? item.title ?? "-",
        variant_title: variant?.title ?? null,
        sku: item.sku,
        available,
      }
    })
    // Items without a published product are not something the owner sells.
    .filter((i) => i.product_id && i.available <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.available - b.available)

  const countOnly = { take: 1, skip: 0 }
  const [quotes, reviews] = await Promise.all([
    query.graph({
      entity: "quote",
      fields: ["id"],
      filters: { status: "pending_merchant" as never },
      pagination: countOnly,
    }),
    query.graph({
      entity: "review",
      fields: ["id"],
      filters: { status: "pending" },
      pagination: countOnly,
    }),
  ])

  res.json({
    bank_transfers: {
      count: bankTransfers.length,
      total: round2(bankTransfers.reduce((sum, t) => sum + t.amount, 0)),
      items: bankTransfers.slice(0, LIST_LIMIT),
    },
    quotes: { count: quotes.metadata?.count ?? 0 },
    reviews: { count: reviews.metadata?.count ?? 0 },
    low_stock: {
      threshold: LOW_STOCK_THRESHOLD,
      count: lowStock.length,
      sold_out: lowStock.filter((i) => i.available <= 0).length,
      items: lowStock.slice(0, LIST_LIMIT),
    },
  })
}
