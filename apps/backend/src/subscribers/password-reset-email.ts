import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  COUNTRY_CODE,
  STOREFRONT_URL,
  passwordResetEmail,
  sendEmail,
} from "../lib/emails"

export default async function passwordResetEmailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  // Admin users reset from the dashboard; only customers get the storefront link.
  if (data.actor_type !== "customer") {
    return
  }

  const params = new URLSearchParams({ token: data.token, email: data.entity_id })
  await sendEmail(container, {
    to: data.entity_id,
    template: "password-reset",
    email: passwordResetEmail(
      `${STOREFRONT_URL}/${COUNTRY_CODE}/account/reset-password?${params}`
    ),
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
