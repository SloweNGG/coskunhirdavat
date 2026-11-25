import { z } from "@medusajs/framework/zod"

export const StoreCreateRestockSubscription = z.object({
  variant_id: z.string().min(1),
  email: z.string().trim().toLowerCase().email().max(254),
})

export type StoreCreateRestockSubscriptionType = z.infer<
  typeof StoreCreateRestockSubscription
>
