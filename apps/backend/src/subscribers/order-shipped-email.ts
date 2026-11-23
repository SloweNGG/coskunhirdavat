import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { orderShippedEmail, sendEmail } from "../lib/emails"

// `shipment.created` is emitted when admin marks a fulfillment as shipped.
export default async function orderShippedEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: [
      "id",
      "labels.tracking_number",
      "labels.tracking_url",
      "order.id",
      "order.email",
      "order.display_id",
    ],
    filters: { id: data.id },
  })

  const order = (fulfillment as any)?.order
  if (!order?.email) {
    return
  }

  await sendEmail(container, {
    to: order.email,
    template: "order-shipped",
    email: orderShippedEmail({
      display_id: order.display_id,
      tracking: (fulfillment.labels ?? []).map((l) => ({
        tracking_number: l?.tracking_number,
        url: l?.tracking_url,
      })),
    }),
    data: { order_id: order.id, fulfillment_id: fulfillment.id },
    idempotency_key: `order-shipped-${fulfillment.id}`,
    resource_id: order.id,
    resource_type: "order",
  })
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
