import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  BANK_TRANSFER_PROVIDER_ID,
  orderPlacedEmail,
  sendEmail,
} from "../lib/emails"

export default async function orderPlacedEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "item_total",
      "subtotal",
      "shipping_total",
      "discount_total",
      "tax_total",
      "total",
      "items.*",
      "shipping_address.*",
      "payment_collections.payments.provider_id",
      "payment_collections.payment_sessions.provider_id",
    ],
    filters: { id: data.id },
  })

  if (!order?.email) {
    logger.warn(`order.placed email skipped: order ${data.id} has no email`)
    return
  }

  const providerIds = (order.payment_collections ?? []).flatMap((pc) => [
    ...(pc?.payments ?? []).map((p) => p?.provider_id),
    ...(pc?.payment_sessions ?? []).map((s) => s?.provider_id),
  ])

  await sendEmail(container, {
    to: order.email,
    template: "order-placed",
    email: orderPlacedEmail({
      ...(order as any),
      bank_transfer: providerIds.includes(BANK_TRANSFER_PROVIDER_ID),
    }),
    data: { order_id: order.id, display_id: order.display_id },
    idempotency_key: `order-placed-${order.id}`,
    resource_id: order.id,
    resource_type: "order",
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
