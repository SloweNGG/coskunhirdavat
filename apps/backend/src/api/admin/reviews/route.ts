import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/reviews?status=&limit=&offset=
 * All reviews (newest first) with the product title, for moderation.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const status = req.query.status as string | undefined
  const take = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const skip = Math.max(Number(req.query.offset) || 0, 0)

  const { data: reviews, metadata } = await query.graph({
    entity: "review",
    fields: ["*", "product.id", "product.title", "product.handle"],
    filters: ["pending", "approved", "rejected"].includes(status ?? "")
      ? { status: status as "pending" }
      : {},
    pagination: { take, skip, order: { created_at: "DESC" } },
  })

  res.json({ reviews, count: metadata?.count ?? 0, limit: take, offset: skip })
}
