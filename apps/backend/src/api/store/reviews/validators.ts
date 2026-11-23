import { z } from "@medusajs/framework/zod"

export const StoreCreateReview = z.object({
  product_id: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(3).max(2000),
})

export type StoreCreateReviewType = z.infer<typeof StoreCreateReview>
