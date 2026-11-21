import { z } from "@medusajs/framework/zod"

export const StorePaytrToken = z.object({
  cart_id: z.string().min(1),
  user_ip: z.string().min(3).max(39),
})

export type StorePaytrTokenType = z.infer<typeof StorePaytrToken>
