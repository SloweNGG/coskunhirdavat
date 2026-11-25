import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createReviewWorkflow } from "../../../workflows/create-review"
import type { StoreCreateReviewType } from "./validators"

/**
 * POST /store/reviews
 * Logged-in customer submits a review; it stays "pending" until an admin approves it.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateReviewType>,
  res: MedusaResponse
) => {
  const { result } = await createReviewWorkflow(req.scope).run({
    input: { ...req.validatedBody, customer_id: req.auth_context.actor_id },
  })

  res.json({ review: result })
}
