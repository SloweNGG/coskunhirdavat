import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

// Shared by the admin and store quote routes.
export const QUOTE_FIELDS = [
  "id",
  "status",
  "created_at",
  "updated_at",
  "customer.id",
  "customer.email",
  "customer.first_name",
  "customer.last_name",
  "customer.company_name",
  "customer.phone",
  "draft_order.id",
  "draft_order.display_id",
  "draft_order.status",
  "draft_order.currency_code",
  "draft_order.total",
  "draft_order.subtotal",
  "draft_order.tax_total",
  "draft_order.items.id",
  "draft_order.items.title",
  "draft_order.items.subtitle",
  "draft_order.items.thumbnail",
  "draft_order.items.variant_title",
  "draft_order.items.variant_sku",
  "draft_order.items.product_handle",
  "draft_order.items.quantity",
  "draft_order.items.unit_price",
  "draft_order.items.total",
]

export const listQuotes = async (
  scope: MedusaContainer,
  filters: Record<string, unknown>
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  // shortcut: no pagination, newest 200 only; add createFindParams when volume grows.
  const { data } = await query.graph({
    entity: "quote",
    fields: QUOTE_FIELDS,
    filters,
    pagination: { take: 200, skip: 0, order: { created_at: "DESC" } },
  })
  return data
}

// Returns the quote plus `preview`: the draft order with the merchant's
// pending edits (offered prices/quantities) applied.
export const retrieveQuoteWithPreview = async (
  scope: MedusaContainer,
  filters: { id: string; customer_id?: string }
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [quote],
  } = await query.graph(
    { entity: "quote", fields: [...QUOTE_FIELDS, "draft_order_id"], filters },
    { throwIfKeyNotFound: true }
  )
  const preview = await scope
    .resolve(Modules.ORDER)
    .previewOrderChange(quote.draft_order_id)
  return {
    ...quote,
    preview: {
      total: preview.total,
      subtotal: preview.subtotal,
      tax_total: preview.tax_total,
      items: preview.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      })),
    },
  }
}

export const CreateQuoteSchema = z.object({ cart_id: z.string().min(1) }).strict()

export const SendQuoteSchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          quantity: z.number().int().min(0),
          unit_price: z.number().min(0),
        })
      )
      .min(1),
  })
  .strict()
