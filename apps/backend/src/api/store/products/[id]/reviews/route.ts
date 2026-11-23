import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import ProductReviewModuleService from "../../../../../modules/product-review/service"

/**
 * GET /store/products/:id/reviews?limit=&offset=
 * Approved reviews of a product, newest first, with the average rating.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const reviewService: ProductReviewModuleService =
    req.scope.resolve(PRODUCT_REVIEW_MODULE)
  const filters = { product_id: req.params.id, status: "approved" as const }
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const [[reviews, count], ratings] = await Promise.all([
    reviewService.listAndCountReviews(filters, {
      select: ["id", "rating", "title", "content", "first_name", "last_name", "created_at"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    }),
    // shortcut: averages in memory; switch to SQL AVG if a product gets thousands of reviews.
    reviewService.listReviews(filters, { select: ["rating"] }),
  ])

  const average = ratings.length
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  res.json({
    reviews: reviews.map((r) => ({
      ...r,
      // Show "Ad S." publicly, never the full last name.
      last_name: r.last_name ? `${r.last_name[0]}.` : "",
    })),
    count,
    limit,
    offset,
    average_rating: Math.round(average * 10) / 10,
  })
}
