import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { abandonedCartEmail, sendEmail } from "../lib/emails"

const REMINDER_KEY = "abandoned_cart_reminded_at"
const MIN_AGE_HOURS = 24
// Older carts are skipped so the first run does not email ancient carts.
const MAX_AGE_DAYS = 7

/** Emails one reminder per open, opted-in cart that has an email and items and sat idle for 24h. */
export default async function abandonedCartReminderJob(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cartModule = container.resolve(Modules.CART)

  const now = Date.now()
  const take = 100
  let skip = 0
  let count = 0
  let sent = 0

  do {
    const { data: carts, metadata } = await query.graph({
      entity: "cart",
      fields: ["id", "email", "metadata", "items.*"],
      filters: {
        email: { $ne: null },
        completed_at: null,
        updated_at: {
          $lt: new Date(now - MIN_AGE_HOURS * 3600_000),
          $gt: new Date(now - MAX_AGE_DAYS * 86400_000),
        },
      },
      pagination: { skip, take, order: { updated_at: "ASC" } },
    })
    count = metadata?.count ?? 0
    skip += take

    for (const cart of carts) {
      // Reminders are commercial messages (ETK / İYS): only for shoppers who opted in at checkout.
      if (
        !cart.email ||
        !cart.items?.length ||
        cart.metadata?.[REMINDER_KEY] ||
        cart.metadata?.marketing_opt_in !== true
      ) {
        continue
      }
      try {
        await sendEmail(container, {
          to: cart.email,
          template: "abandoned-cart",
          email: abandonedCartEmail({ cart_id: cart.id, items: cart.items as any }),
          data: { cart_id: cart.id },
          idempotency_key: `abandoned-cart-${cart.id}`,
          resource_id: cart.id,
          resource_type: "cart",
        })
        await cartModule.updateCarts(cart.id, {
          metadata: { ...(cart.metadata ?? {}), [REMINDER_KEY]: new Date().toISOString() },
        })
        sent++
      } catch (e) {
        logger.error(`Abandoned cart reminder failed for ${cart.id}: ${(e as Error).message}`)
      }
    }
  } while (skip < count)

  logger.info(`Abandoned cart reminders sent: ${sent}`)
}

export const config = {
  name: "abandoned-cart-reminder",
  schedule: "0 * * * *", // hourly
}
