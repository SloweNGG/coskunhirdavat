import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  getVariantAvailability,
} from "@medusajs/framework/utils"
import { RESTOCK_MODULE } from "../../../modules/restock"
import RestockModuleService from "../../../modules/restock/service"
import type { StoreCreateRestockSubscriptionType } from "./validators"

/** Subscribes an email to a "back in stock" notification for an out-of-stock variant. */
export async function POST(
  req: MedusaStoreRequest<StoreCreateRestockSubscriptionType>,
  res: MedusaResponse
) {
  const { variant_id, email } = req.validatedBody
  const salesChannelId = req.publishable_key_context?.sales_channel_ids?.[0]
  if (!salesChannelId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Publishable API key has no sales channel."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [variant],
  } = await query.graph({
    entity: "product_variant",
    fields: ["id", "manage_inventory", "allow_backorder"],
    filters: { id: variant_id },
  })
  if (!variant) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ürün seçeneği bulunamadı.")
  }

  const availability = variant.manage_inventory && !variant.allow_backorder
    ? (await getVariantAvailability(query, {
        variant_ids: [variant_id],
        sales_channel_id: salesChannelId,
      }))[variant_id]?.availability ?? 0
    : Infinity
  if (availability > 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Bu ürün şu anda stokta.")
  }

  const restock: RestockModuleService = req.scope.resolve(RESTOCK_MODULE)
  const [existing] = await restock.listRestockSubscriptions({
    variant_id,
    sales_channel_id: salesChannelId,
    email,
  })
  if (!existing) {
    await restock.createRestockSubscriptions({
      variant_id,
      sales_channel_id: salesChannelId,
      email,
      customer_id: req.auth_context?.actor_id ?? null,
    })
  }

  res.json({ success: true })
}
