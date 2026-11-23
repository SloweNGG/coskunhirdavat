import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { getVariantAvailability, MedusaError } from "@medusajs/framework/utils"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"

export type ReorderInput = {
  order_id: string
  customer_id: string
}

const ADDRESS_FIELDS = [
  "first_name",
  "last_name",
  "company",
  "address_1",
  "address_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "phone",
] as const

/**
 * Reads the customer's order and keeps only items whose variant still exists,
 * belongs to a published product and has stock (quantity capped at stock).
 */
const prepareReorderStep = createStep(
  "prepare-reorder",
  async ({ order_id, customer_id }: ReorderInput, { container }) => {
    const query = container.resolve("query")

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "region_id",
        "sales_channel_id",
        "items.variant_id",
        "items.quantity",
        "shipping_address.*",
      ],
      filters: { id: order_id, customer_id },
    })
    if (!order) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Sipariş bulunamadı")
    }

    // Sum quantities per variant (an order may list a variant twice).
    const wanted = new Map<string, number>()
    for (const item of order.items ?? []) {
      if (item?.variant_id) {
        wanted.set(
          item.variant_id,
          (wanted.get(item.variant_id) ?? 0) + Number(item.quantity)
        )
      }
    }

    const variantIds = [...wanted.keys()]
    const { data: variants } = variantIds.length
      ? await query.graph({
          entity: "variant",
          fields: ["id", "manage_inventory", "allow_backorder", "product.status"],
          filters: { id: variantIds },
        })
      : { data: [] }
    const availability =
      variantIds.length && order.sales_channel_id
        ? await getVariantAvailability(query, {
            variant_ids: variantIds,
            sales_channel_id: order.sales_channel_id,
          })
        : {}

    const items: { variant_id: string; quantity: number }[] = []
    for (const variant of variants) {
      if (variant.product?.status !== "published") {
        continue
      }
      let quantity = wanted.get(variant.id) ?? 0
      if (variant.manage_inventory && !variant.allow_backorder) {
        quantity = Math.min(quantity, availability[variant.id]?.availability ?? 0)
      }
      if (quantity > 0) {
        items.push({ variant_id: variant.id, quantity })
      }
    }

    if (!items.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Bu siparişteki ürünlerin hiçbiri şu anda satışta değil."
      )
    }

    const address = order.shipping_address
    return new StepResponse({
      cart: {
        region_id: order.region_id ?? undefined,
        sales_channel_id: order.sales_channel_id ?? undefined,
        customer_id,
        email: order.email ?? undefined,
        shipping_address: address
          ? Object.fromEntries(
              ADDRESS_FIELDS.map((key) => [key, address[key] ?? undefined])
            )
          : undefined,
        items,
      },
      skipped: wanted.size - items.length,
    })
  }
)

export const reorderWorkflow = createWorkflow(
  "reorder",
  (input: ReorderInput) => {
    const prepared = prepareReorderStep(input)
    const cartInput = transform({ prepared }, ({ prepared }) => prepared.cart)
    const cart = createCartWorkflow.runAsStep({ input: cartInput })

    return new WorkflowResponse(
      transform({ cart, prepared }, ({ cart, prepared }) => ({
        cart_id: cart.id,
        skipped: prepared.skipped,
      }))
    )
  }
)
