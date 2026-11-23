import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
} from "@medusajs/framework/utils"
import { restockEmail, sendEmail } from "../lib/emails"
import { RESTOCK_MODULE } from "../modules/restock"
import RestockModuleService from "../modules/restock/service"

/** Emails restock subscribers whose variant is available again, then removes the subscription. */
export default async function restockNotificationJob(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const restock: RestockModuleService = container.resolve(RESTOCK_MODULE)

  // shortcut: loads every subscription at once; paginate if this grows to tens of thousands.
  const subscriptions = await restock.listRestockSubscriptions({})
  if (!subscriptions.length) {
    return
  }

  const bySalesChannel = new Map<string, Set<string>>()
  for (const s of subscriptions) {
    const ids = bySalesChannel.get(s.sales_channel_id) ?? new Set<string>()
    ids.add(s.variant_id)
    bySalesChannel.set(s.sales_channel_id, ids)
  }

  const restocked = new Set<string>() // `${sales_channel_id}:${variant_id}`
  for (const [salesChannelId, variantIds] of bySalesChannel) {
    const availability = await getVariantAvailability(query, {
      variant_ids: [...variantIds],
      sales_channel_id: salesChannelId,
    })
    for (const id of variantIds) {
      if ((availability[id]?.availability ?? 0) > 0) {
        restocked.add(`${salesChannelId}:${id}`)
      }
    }
  }

  const due = subscriptions.filter((s) =>
    restocked.has(`${s.sales_channel_id}:${s.variant_id}`)
  )
  if (!due.length) {
    return
  }

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "product.title", "product.handle"],
    filters: { id: [...new Set(due.map((s) => s.variant_id))] },
  })
  const variantById = new Map(variants.map((v) => [v.id, v]))

  let sent = 0
  for (const s of due) {
    const variant = variantById.get(s.variant_id)
    try {
      await sendEmail(container, {
        to: s.email,
        template: "restock",
        email: restockEmail({
          product_title: variant?.product?.title ?? "Ürün",
          variant_title: variant?.title,
          product_handle: variant?.product?.handle,
          variant_id: s.variant_id,
        }),
        data: { variant_id: s.variant_id },
        idempotency_key: `restock-${s.id}`,
        resource_id: s.variant_id,
        resource_type: "product_variant",
      })
      await restock.deleteRestockSubscriptions(s.id)
      sent++
    } catch (e) {
      logger.error(`Restock email failed for ${s.id}: ${(e as Error).message}`)
    }
  }
  logger.info(`Restock notifications sent: ${sent}`)
}

export const config = {
  name: "restock-notification",
  schedule: "*/15 * * * *",
}
