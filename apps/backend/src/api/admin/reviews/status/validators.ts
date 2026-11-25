import { z } from "@medusajs/framework/zod"

export const AdminUpdateReviewStatus = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["pending", "approved", "rejected"]),
})

export type AdminUpdateReviewStatusType = z.infer<typeof AdminUpdateReviewStatus>
